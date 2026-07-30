import { NextResponse } from "next/server";
import { firstErrorMessage, fulfillRequestSchema } from "@/lib/schema";
import { fetchPayment, isPaymentConfigured, orderReference, verifyPayment } from "@/lib/moyasar";
import { fulfill } from "@/lib/fulfillment";
import { sendDelivery } from "@/lib/email";

export const runtime = "nodejs";
// توليد عدة صور على التوازي يحتاج وقتًا أطول من الافتراضي.
// ملاحظة: منصّة النشر قد تُقصّر هذه المدة حسب الخطة.
export const maxDuration = 300;

/**
 * سقف تكلفة: كل عملية دفع تُنفَّذ عددًا محدودًا من المرات، فلا يستهلك أحدٌ
 * رصيد OpenAI بتكرار الطلب بنفس معرّف الدفع. السماح بأكثر من مرة واحدة
 * يتيح إعادة المحاولة إن فشل التوليد.
 *
 * الحدّ محفوظ في ذاكرة نسخة الخادم (كما في lib/persist.ts)، فيُصفَّر عند إعادة
 * النشر أو مع نسخة أخرى. كافٍ لمنع الاستنزاف، والترقية الطبيعية لاحقًا هي
 * مخزن مشترك (Vercel KV) إن دعت الحاجة.
 */
const MAX_ATTEMPTS = 3;
const attempts = new Map<string, number>();

function claimAttempt(paymentId: string): boolean {
  const used = attempts.get(paymentId) ?? 0;
  if (used >= MAX_ATTEMPTS) return false;
  attempts.set(paymentId, used + 1);
  return true;
}

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

  const { paymentId, story, scene, childLooks } = parsed.data;

  // التصريح الوحيد بالتنفيذ: عملية دفع مكتملة ومطابقة لسعر الخدمة.
  let verified;
  try {
    verified = verifyPayment(await fetchPayment(paymentId));
  } catch {
    return NextResponse.json(
      { error: "تعذّر التحقق من الدفع الآن. حاولي بعد قليل." },
      { status: 502 }
    );
  }

  if (!verified.ok) {
    console.error(`[fulfill] رفض التنفيذ ${paymentId}: ${verified.reason}`);
    return NextResponse.json(
      { error: "لم نتمكن من تأكيد الدفع لهذا الطلب." },
      { status: 403 }
    );
  }

  if (!claimAttempt(paymentId)) {
    return NextResponse.json(
      {
        error:
          "بلغت هذه العملية حدّ المحاولات. راسلينا برقم الطلب وسنُسلّمك الخدمة يدويًا.",
      },
      { status: 429 }
    );
  }

  const metadata = verified.payment.metadata ?? {};
  // ما دفع المشتري مقابله هو ما وصفه في نموذج الطلب؛ نعطيه الأولوية،
  // ونقبل ما يكتبه في صفحة التسليم إن كان قد ترك الحقل فارغًا.
  const hint = metadata.details?.trim() || "";

  try {
    const result = await fulfill({
      product: verified.product,
      story,
      scene: hint || scene,
      childLooks: hint || childLooks,
    });

    if (result.images.length === 0) {
      // لم نُسلّم شيئًا: نُعيد المحاولة المستهلكة كي لا تُحرق على فشلٍ تقني.
      attempts.set(paymentId, Math.max(0, (attempts.get(paymentId) ?? 1) - 1));
      return NextResponse.json(
        { error: "تعذّر رسم الصور الآن. حاولي مرة أخرى بعد قليل." },
        { status: 502 }
      );
    }

    const reference = orderReference(paymentId);
    const to = metadata.buyer_email?.trim();
    const emailed = to
      ? await sendDelivery({
          to,
          productName: verified.product.name,
          reference,
          storyTitle: story.title,
          images: result.images,
        })
      : false;

    console.log(
      `[fulfill] تم — طلب ${reference} | ${verified.product.name} | ` +
        `${result.images.length} صورة | بريد: ${emailed ? "أُرسل" : "لم يُرسل"}`
    );

    return NextResponse.json({
      images: result.images,
      failed: result.failed,
      emailed,
      reference,
    });
  } catch (err) {
    attempts.set(paymentId, Math.max(0, (attempts.get(paymentId) ?? 1) - 1));

    if (err instanceof Error && err.message === "MISSING_API_KEY") {
      console.error("[fulfill] مفتاح OpenAI غير مضبوط");
      return NextResponse.json(
        { error: "الخدمة غير مهيأة على الخادم. تم إبلاغ فريق غِراس." },
        { status: 500 }
      );
    }

    console.error("[fulfill] فشل التنفيذ:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "تعذّر إنجاز الخدمة الآن. حاولي مرة أخرى بعد قليل." },
      { status: 502 }
    );
  }
}
