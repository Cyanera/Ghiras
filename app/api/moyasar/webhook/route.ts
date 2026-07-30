import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { fetchPayment, isPaymentConfigured } from "@/lib/moyasar";
import { handlePaidPayment } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// مستقبل الـ webhook من ميسر — هذا هو المصدر الموثوق لتأكيد الطلبات، لأنّه
// يعمل حتى لو أغلق المشتري المتصفح قبل رجوعه للموقع.
//
// الإعداد في لوحة ميسر ← الإشعارات (Webhooks):
//   • الرابط: https://ghiras.kids/api/moyasar/webhook
//   • الأحداث: payment_paid و payment_failed
//   • «الرمز السري» الذي تضعينه هناك = MOYASAR_WEBHOOK_SECRET

/** مقارنة ثابتة الزمن حتى لا يُستدل على الرمز السري بقياس زمن الرد. */
function secretMatches(received: unknown): boolean {
  const expected = process.env.MOYASAR_WEBHOOK_SECRET?.trim();
  if (!expected) return false;
  if (typeof received !== "string" || received.length === 0) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (!secretMatches(body.secret_token)) {
    console.error("[webhook] رمز سري غير مطابق — تم رفض الإشعار");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = (body.data ?? {}) as Record<string, unknown>;
  const paymentId = typeof data.id === "string" ? data.id : null;
  const type = typeof body.type === "string" ? body.type : "";

  if (!paymentId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (type && type !== "payment_paid") {
    console.log(`[webhook] ${type} — ${paymentId}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    // لا نثق بالمبلغ الوارد في الإشعار: نُعيد جلب العملية من ميسر.
    handlePaidPayment(await fetchPayment(paymentId));
  } catch {
    console.error(`[webhook] تعذّر جلب العملية ${paymentId}`);
    // 500 كي يُعيد ميسر إرسال الإشعار لاحقًا.
    return NextResponse.json({ error: "verification failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
