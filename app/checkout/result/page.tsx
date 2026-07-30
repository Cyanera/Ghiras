import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { DELIVERY_NOTE, ORDER_EMAIL } from "@/lib/services";
import { fetchPayment, isPaymentConfigured, orderReference, verifyPayment } from "@/lib/moyasar";

export const metadata: Metadata = {
  title: "نتيجة الدفع — غِراس",
  robots: { index: false },
};

// النتيجة تعتمد على استدعاء حيّ لميسر، فلا تُخزَّن مؤقتًا.
export const dynamic = "force-dynamic";

type Outcome =
  | { kind: "paid"; productName: string; reference: string; email?: string }
  | { kind: "failed"; message: string }
  | { kind: "unverified"; message: string };

async function resolveOutcome(paymentId: string | undefined): Promise<Outcome> {
  if (!paymentId) {
    return { kind: "unverified", message: "لم نتلقَّ معرّف عملية الدفع." };
  }

  if (!isPaymentConfigured()) {
    return { kind: "unverified", message: "الدفع الإلكتروني غير مهيَّأ على الخادم." };
  }

  let payment;
  try {
    payment = await fetchPayment(paymentId);
  } catch {
    return {
      kind: "unverified",
      message: "تعذّر التحقق من حالة الدفع الآن. إن خُصم المبلغ فسنتواصل معك.",
    };
  }

  const verified = verifyPayment(payment);

  if (verified.ok) {
    return {
      kind: "paid",
      productName: verified.product.name,
      reference: orderReference(payment.id),
      email: payment.metadata?.buyer_email,
    };
  }

  if (verified.reason === "not_paid") {
    return {
      kind: "failed",
      message:
        payment.source?.message?.trim() ||
        "لم تكتمل عملية الدفع. لم يُخصم أي مبلغ، ويمكنك المحاولة مرة أخرى.",
    };
  }

  // دفعٌ ناجح لكن المبلغ أو الخدمة لا يطابقان المتوقّع — يحتاج مراجعة بشرية.
  console.error(
    `payment ${payment.id} verification failed: ${verified.reason} (amount ${payment.amount} ${payment.currency})`
  );
  return {
    kind: "unverified",
    message: "استلمنا الدفع لكن تعذّر مطابقته بالخدمة. سنراجع الطلب ونتواصل معك.",
  };
}

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; status?: string; message?: string }>;
}) {
  const { id } = await searchParams;
  const outcome = await resolveOutcome(id);

  const card =
    "flex flex-col gap-4 rounded-3xl border border-line bg-white p-6 shadow-[0_14px_44px_-18px_rgba(42,37,48,0.22)] sm:p-8";

  if (outcome.kind === "paid") {
    return (
      <PageShell title="تم الدفع بنجاح" subtitle="وصلنا طلبك، وبدأنا العمل عليه.">
        <div className={card}>
          <p className="text-4xl">🌱</p>
          <h2 className="text-xl font-black text-ink">شكرًا لك!</h2>
          <p className="leading-relaxed text-ink-soft">
            تم تأكيد طلب «{outcome.productName}».
          </p>

          <div className="flex items-center justify-between rounded-2xl bg-page px-4 py-3">
            <span className="text-sm font-bold text-ink">رقم الطلب</span>
            <span className="font-black text-ink" dir="ltr">{outcome.reference}</span>
          </div>

          <p className="text-sm leading-relaxed text-ink-soft">
            {DELIVERY_NOTE}
            {outcome.email && (
              <>
                {" "}سنرسل الخدمة وإيصال الدفع على{" "}
                <span dir="ltr" className="font-bold text-ink">{outcome.email}</span>.
              </>
            )}
          </p>
          <p className="text-sm leading-relaxed text-ink-soft">
            لأي استفسار راسلينا على{" "}
            <a href={`mailto:${ORDER_EMAIL}`} className="font-bold text-blue-deep underline-offset-4 hover:underline" dir="ltr">
              {ORDER_EMAIL}
            </a>{" "}
            مع ذكر رقم الطلب.
          </p>

          <Link
            href="/"
            className="mt-2 rounded-full bg-grass px-5 py-3 text-center font-bold text-white transition hover:brightness-110"
          >
            إنشاء قصة جديدة
          </Link>
        </div>
      </PageShell>
    );
  }

  const isFailed = outcome.kind === "failed";

  return (
    <PageShell
      title={isFailed ? "لم تكتمل عملية الدفع" : "طلبك تحت المراجعة"}
      subtitle={isFailed ? "لا تقلقي — يمكنك المحاولة مرة أخرى." : undefined}
    >
      <div className={card}>
        <p className="text-4xl">{isFailed ? "🌾" : "⏳"}</p>
        <p className="leading-relaxed text-ink-soft">{outcome.message}</p>
        <p className="text-sm leading-relaxed text-ink-soft">
          للمساعدة راسلينا على{" "}
          <a href={`mailto:${ORDER_EMAIL}`} className="font-bold text-blue-deep underline-offset-4 hover:underline" dir="ltr">
            {ORDER_EMAIL}
          </a>
          .
        </p>

        <Link
          href="/khadamat"
          className="mt-2 rounded-full bg-blue-deep px-5 py-3 text-center font-bold text-white transition hover:brightness-110"
        >
          العودة إلى الخدمات
        </Link>
      </div>
    </PageShell>
  );
}
