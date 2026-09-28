import { NextResponse } from "next/server";
import { firstErrorMessage, fulfillRequestSchema } from "@/lib/schema";
import { fetchPayment, isPaymentConfigured, orderReference } from "@/lib/moyasar";
import { deliverOrder } from "@/lib/orders";

export const runtime = "nodejs";
// توليد عدة صور على التوازي يحتاج وقتًا أطول من الافتراضي.
// ملاحظة: منصّة النشر قد تُقصّر هذه المدة حسب الخطة.
export const maxDuration = 300;

/**
 * مسار التسليم من المتصفح — يعرض الصور للمشتري فورًا وهو على الصفحة.
 *
 * التسليم نفسه (والحماية من التكرار وتكلفته) في lib/orders.ts، المشترك مع
 * إشعار ميسر. فأيّهما وصل أولًا ينفّذ، والآخر يجد الطلب مُسلَّمًا.
 */
export async function POST(request: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json({ error: "الدفع غير مهيَّأ على الخادم." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = fulfillRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstErrorMessage(parsed.error, "تحققي من بيانات الطلب") },
      { status: 400 }
    );
  }

  const { paymentId, story } = parsed.data;

  // التصريح الوحيد بالتنفيذ: عملية دفع مكتملة ومطابقة لسعر الخدمة.
  let payment;
  try {
    payment = await fetchPayment(paymentId);
  } catch {
    return NextResponse.json(
      { error: "تعذّر التحقق من الدفع الآن. حاولي بعد قليل." },
      { status: 502 }
    );
  }

  const outcome = await deliverOrder(payment, story);
  const reference = orderReference(paymentId);

  switch (outcome.status) {
    case "delivered":
      return NextResponse.json({
        status: "delivered",
        images: outcome.images,
        failed: outcome.failed,
        emailed: outcome.emailed,
        reference,
      });

    case "already":
      // سُلِّم عبر الإشعار قبل أن تفتح الصفحة — الصور في بريدها.
      return NextResponse.json({ status: "already", reference });

    case "needStory":
      return NextResponse.json({ status: "needStory", reference });

    case "rejected":
      return NextResponse.json(
        { error: "لم نتمكن من تأكيد الدفع لهذا الطلب." },
        { status: 403 }
      );

    default:
      return NextResponse.json({ error: outcome.reason }, { status: 502 });
  }
}
