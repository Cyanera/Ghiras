// مخزن الطلبات المدفوعة — كود خادم فقط.
//
// لماذا نحفظ: التسليم الآلي يجب أن يعمل حتى لو أغلق المشتري المتصفح فورًا بعد
// الدفع. فنحفظ الطلب (القصة وبريد المشتري) لحظة إنشاء الفاتورة، ليتمكّن إشعار
// ميسر من إنجاز الخدمة وإرسالها من الخادم وحده.
//
// المخزن: Vercel KV / Upstash Redis عبر REST إن كانت متغيّراته مضبوطة، وإلّا
// ذاكرة نسخة الخادم (تكفي للتطوير، ولا يُعتمد عليها في الإنتاج).
//
// الاحتفاظ: كل طلب يُحذف تلقائيًا بعد ORDER_TTL_DAYS، فلا نحتفظ بقصص العملاء
// وبرائدهم أكثر من مدّة الدعم المعقولة.

const ORDER_TTL_DAYS = 14;
const TTL_SECONDS = ORDER_TTL_DAYS * 24 * 60 * 60;

export const RETENTION_DAYS = ORDER_TTL_DAYS;

export type StoredOrder = {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  childName: string;
  storyTitle: string;
  details: string;
  story: { title: string; story: string; key_scene: string; image_prompt: string };
  createdAt: number;
};

// —— الواجهة الخلفية: Upstash/Vercel KV عبر REST ——

function kvConfig(): { url: string; token: string } | null {
  const url = (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)?.trim();
  const token = (
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  )?.trim();
  return url && token ? { url, token } : null;
}

/** هل الحفظ الدائم مُهيَّأ؟ بدونه لا يعمل التسليم عبر الإشعار بموثوقية. */
export function isOrderStoreConfigured(): boolean {
  return kvConfig() !== null;
}

/**
 * استدعاء أمر Redis عبر REST. مثال: ["SET", key, value, "EX", "3600"].
 * يُعيد null عند الفشل بدل أن يرمي، فلا يُسقط مسارًا مدفوعًا.
 */
async function kv(command: (string | number)[]): Promise<unknown | null> {
  const cfg = kvConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command.map(String)),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[order-store] ${command[0]} → ${res.status}`);
      return null;
    }

    const json = (await res.json()) as { result?: unknown };
    return json.result ?? null;
  } catch (err) {
    console.error(
      "[order-store] تعذّر الاتصال بالمخزن:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// —— بديل الذاكرة (تطوير فقط) ——

const memory = new Map<string, { value: string; expires: number }>();

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string): void {
  memory.set(key, { value, expires: Date.now() + TTL_SECONDS * 1000 });
}

/** SET إن لم يكن موجودًا — يُعيد true لأول من ينجح فقط. */
function memorySetNx(key: string, value: string): boolean {
  if (memoryGet(key) !== null) return false;
  memorySet(key, value);
  return true;
}

// —— العمليات ——

const orderKey = (invoiceId: string) => `ghiras:order:${invoiceId}`;
const claimKey = (invoiceId: string) => `ghiras:fulfilled:${invoiceId}`;

/** حفظ الطلب لحظة إنشاء الفاتورة، مفتاحه رقم الفاتورة. */
export async function saveOrder(invoiceId: string, order: StoredOrder): Promise<void> {
  const value = JSON.stringify(order);

  if (isOrderStoreConfigured()) {
    await kv(["SET", orderKey(invoiceId), value, "EX", TTL_SECONDS]);
    return;
  }

  memorySet(orderKey(invoiceId), value);
}

export async function loadOrder(invoiceId: string): Promise<StoredOrder | null> {
  const raw = isOrderStoreConfigured()
    ? await kv(["GET", orderKey(invoiceId)])
    : memoryGet(orderKey(invoiceId));

  if (typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw) as StoredOrder;
    return parsed?.story?.story ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * حجز التسليم: يُعيد true لأول مُنفِّذ فقط.
 *
 * صفحة النتيجة وإشعار ميسر قد يصلان معًا لنفس الطلب، والحجز يمنع توليد الصور
 * (ودفع تكلفتها) مرتين. في KV يُنفَّذ بـ SET NX فيكون ذرّيًا فعلًا.
 */
export async function claimFulfillment(invoiceId: string): Promise<boolean> {
  if (isOrderStoreConfigured()) {
    const result = await kv([
      "SET",
      claimKey(invoiceId),
      String(Date.now()),
      "NX",
      "EX",
      TTL_SECONDS,
    ]);
    return result === "OK";
  }

  return memorySetNx(claimKey(invoiceId), String(Date.now()));
}

/** إلغاء الحجز إن فشل التسليم، ليتمكّن غيره من إعادة المحاولة. */
export async function releaseFulfillment(invoiceId: string): Promise<void> {
  if (isOrderStoreConfigured()) {
    await kv(["DEL", claimKey(invoiceId)]);
    return;
  }

  memory.delete(claimKey(invoiceId));
}

export async function isFulfilled(invoiceId: string): Promise<boolean> {
  const raw = isOrderStoreConfigured()
    ? await kv(["GET", claimKey(invoiceId)])
    : memoryGet(claimKey(invoiceId));

  return raw !== null && raw !== undefined;
}

/** حذف الطلب بعد التسليم الناجح — لا نحتفظ بالقصة بلا داعٍ. */
export async function forgetOrder(invoiceId: string): Promise<void> {
  if (isOrderStoreConfigured()) {
    await kv(["DEL", orderKey(invoiceId)]);
    return;
  }

  memory.delete(orderKey(invoiceId));
}
