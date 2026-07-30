// جسر القصة بين الصفحات في متصفح المشتري.
//
// القصة تُحفظ هنا لحظة اختيار الخدمة، ثم تُرفق بالطلب عند إنشاء الفاتورة
// لتُحفظ على الخادم (lib/order-store.ts) فيتمّ التسليم آليًا بلا متصفح.
// وتبقى النسخة المحلية شبكة أمان: تُستخدم إن لم يجد الخادم الطلب المحفوظ.

const STORY_KEY = "ghiras:order-story:v1";
const DELIVERY_PREFIX = "ghiras:delivery:v1:";

export type StoredStory = {
  title: string;
  story: string;
  key_scene?: string;
  image_prompt?: string;
};

export function saveOrderStory(story: StoredStory): void {
  try {
    localStorage.setItem(STORY_KEY, JSON.stringify(story));
  } catch {
    // ممتلئ أو محجوب — نكمل، وصفحة التسليم تعرض بديلًا للصق القصة.
  }
}

export function loadOrderStory(): StoredStory | null {
  try {
    const raw = localStorage.getItem(STORY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredStory>;
    if (typeof parsed?.title !== "string" || typeof parsed?.story !== "string") return null;
    if (!parsed.title.trim() || !parsed.story.trim()) return null;

    return {
      title: parsed.title,
      story: parsed.story,
      key_scene: typeof parsed.key_scene === "string" ? parsed.key_scene : "",
      image_prompt: typeof parsed.image_prompt === "string" ? parsed.image_prompt : "",
    };
  } catch {
    return null;
  }
}

// —— حفظ الصور المُسلَّمة، حتى لا يُعاد توليدها عند تحديث الصفحة ——

export type StoredDelivery = { caption: string; image: string }[];

export function saveDelivery(paymentId: string, images: StoredDelivery): void {
  try {
    localStorage.setItem(DELIVERY_PREFIX + paymentId, JSON.stringify(images));
  } catch {
    // الصور كبيرة وقد تتجاوز سعة التخزين — التنزيل متاح في الحالتين.
  }
}

export function loadDelivery(paymentId: string): StoredDelivery | null {
  try {
    const raw = localStorage.getItem(DELIVERY_PREFIX + paymentId);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredDelivery;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}
