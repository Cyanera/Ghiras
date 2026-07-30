import { NextResponse } from "next/server";
import { fetchPayment, isPaymentConfigured, type MoyasarPayment } from "@/lib/moyasar";
import { handlePaidPayment } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// عنوان العودة الذي نُمرّره لميسر عند إنشاء الفاتورة.
// ميسر قد يستخدمه بطريقتين، فنتعامل مع الاثنتين:
//   • GET  — تحويل المتصفح بعد الدفع مع ?id=… فنوجّه المشتري لصفحة النتيجة.
//   • POST — إشعار من الخادم بجسم JSON، فنؤكّد الطلب ونعيد 200.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  const result = new URL("/checkout/result", url.origin);
  if (id) result.searchParams.set("id", id);

  // التحقق والتأكيد يحدثان في صفحة النتيجة؛ هنا نُحوّل فقط.
  return NextResponse.redirect(result, { status: 303 });
}

export async function POST(request: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  // الإشعار قد يحمل عملية دفع أو فاتورة؛ في الحالتين نحتاج معرّف الدفع.
  const paymentId = extractPaymentId(body);
  if (!paymentId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    // لا نثق بجسم الإشعار: نُعيد جلب العملية من ميسر بالمفتاح السري.
    handlePaidPayment(await fetchPayment(paymentId));
  } catch {
    console.error(`[callback] تعذّر جلب العملية ${paymentId}`);
    // 500 كي يُعيد ميسر المحاولة.
    return NextResponse.json({ error: "verification failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/** استخراج معرّف الدفع من أشكال الإشعار المحتملة. */
function extractPaymentId(body: Record<string, unknown>): string | null {
  const data = (body.data ?? body) as Record<string, unknown>;

  // فاتورة مدفوعة تحمل قائمة عملياتها.
  const payments = data.payments;
  if (Array.isArray(payments)) {
    const paid = (payments as MoyasarPayment[]).find((p) => p?.status === "paid");
    if (typeof paid?.id === "string") return paid.id;
  }

  const id = data.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
