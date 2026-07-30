// ربط بوابة الدفع «ميسر» (Moyasar) — كود خادم فقط.
// لا تستوردي هذا الملف في أي مكوّن يعمل في المتصفح: يحتوي المفتاح السري.
//
// الطريقة المستخدمة: Invoices API — نُنشئ فاتورة في الخادم ثم نحوّل المشتري
// إلى صفحة الدفع المستضافة عند ميسر. ميزتها أنّ المبلغ يُحدَّد في الخادم من
// قائمة الأسعار، فلا يمكن التلاعب به من المتصفح.

import { getProduct, type Product } from "@/lib/services";

const API_BASE = "https://api.moyasar.com/v1";

/** المفتاح السري (sk_test_… أو sk_live_…) من لوحة ميسر ← «مفاتيح الربط». */
function secretKey(): string {
  const key = process.env.MOYASAR_SECRET_KEY?.trim();
  if (!key) throw new Error("MISSING_MOYASAR_KEY");
  return key;
}

/** هل الدفع الإلكتروني مهيَّأ؟ يُفعَّل تلقائيًا بمجرد ضبط المفتاح السري. */
export function isPaymentConfigured(): boolean {
  return (process.env.MOYASAR_SECRET_KEY?.trim().length ?? 0) > 0;
}

/** هل نعمل على مفاتيح البيئة التجريبية؟ يُستخدم لعرض تنويه «وضع تجريبي». */
export function isTestMode(): boolean {
  return process.env.MOYASAR_SECRET_KEY?.trim().startsWith("sk_test_") ?? false;
}

/** ميسر يتعامل بالهللات: 5 ر.س = 500. */
export function toHalalas(sar: number): number {
  return Math.round(sar * 100);
}

/** المصادقة: Basic بالمفتاح السري كاسم مستخدم وكلمة مرور فارغة. */
function authHeader(): string {
  return `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`;
}

export type MoyasarInvoice = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  /** رابط صفحة الدفع المستضافة — نحوّل المشتري إليه. */
  url: string;
};

export type MoyasarPayment = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  invoice_id?: string | null;
  /** رسالة الخطأ عند الفشل. */
  source?: { message?: string | null; type?: string | null } | null;
  metadata?: Record<string, string> | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    // لا نُسجّل نص الطلب كي لا تتسرّب بيانات المشتري إلى السجلات.
    console.error(`Moyasar ${init?.method ?? "GET"} ${path} → ${res.status}`, text.slice(0, 500));
    throw new Error(res.status === 401 ? "MOYASAR_UNAUTHORIZED" : "MOYASAR_REQUEST_FAILED");
  }

  return JSON.parse(text) as T;
}

/** إنشاء فاتورة والحصول على رابط صفحة الدفع. */
export async function createInvoice(args: {
  amount: number; // بالهللات
  description: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<MoyasarInvoice> {
  return request<MoyasarInvoice>("/invoices", {
    method: "POST",
    body: JSON.stringify({
      amount: args.amount,
      currency: "SAR",
      description: args.description,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
    }),
  });
}

/** جلب عملية دفع للتحقق منها في الخادم. */
export async function fetchPayment(id: string): Promise<MoyasarPayment> {
  return request<MoyasarPayment>(`/payments/${encodeURIComponent(id)}`);
}

export type VerifiedPayment =
  | { ok: true; product: Product; payment: MoyasarPayment }
  | { ok: false; reason: "not_paid" | "mismatch" | "unknown_product"; payment: MoyasarPayment };

/**
 * التحقق من أنّ الدفع مكتمل فعلًا وبالمبلغ الصحيح.
 * لا نثق أبدًا بمعطيات التحويل (query params) — المصدر الوحيد للحقيقة هو هذا الاستدعاء.
 */
export function verifyPayment(payment: MoyasarPayment): VerifiedPayment {
  if (payment.status !== "paid") {
    return { ok: false, reason: "not_paid", payment };
  }

  const product = getProduct(payment.metadata?.product_id);
  if (!product) {
    return { ok: false, reason: "unknown_product", payment };
  }

  // حتى مع الدفع الناجح، نتأكد أنّ المبلغ والعملة يطابقان سعر الخدمة المعلن.
  if (payment.currency !== "SAR" || payment.amount !== toHalalas(product.price)) {
    return { ok: false, reason: "mismatch", payment };
  }

  return { ok: true, product, payment };
}

/** مرجع مختصر يُعرض للمشتري ويسهّل البحث في لوحة ميسر. */
export function orderReference(paymentId: string): string {
  return paymentId.slice(0, 8).toUpperCase();
}
