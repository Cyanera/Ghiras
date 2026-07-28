import type { Metadata } from "next";
import PageShell, { Section } from "@/components/PageShell";
import {
  BUSINESS_INFO,
  ORDER_EMAIL,
  WHATSAPP_NUMBER,
  FREELANCE_DOC_NUMBER,
} from "@/lib/services";

export const metadata: Metadata = {
  title: "تواصل معنا — غِراس",
  description: "تواصلي مع فريق غِراس عبر البريد الإلكتروني أو واتساب.",
};

export default function ContactPage() {
  const hasWhatsapp = WHATSAPP_NUMBER.trim().length > 0;

  return (
    <PageShell
      title="تواصل معنا"
      subtitle="يسعدنا استقبال طلباتك واستفساراتك."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={`mailto:${ORDER_EMAIL}`}
          className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-6 transition hover:border-blue"
        >
          <span className="text-sm font-medium text-ink-soft">البريد الإلكتروني</span>
          <span className="text-lg font-bold text-ink">{ORDER_EMAIL}</span>
        </a>

        {hasWhatsapp && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-6 transition hover:border-grass"
          >
            <span className="text-sm font-medium text-ink-soft">واتساب</span>
            <span className="text-lg font-bold text-ink" dir="ltr">+{WHATSAPP_NUMBER}</span>
          </a>
        )}
      </div>

      <Section title="معلومات النشاط">
        <p>الاسم التجاري: {BUSINESS_INFO.name}</p>
        {BUSINESS_INFO.owner.trim().length > 0 && (
          <p>صاحب النشاط: {BUSINESS_INFO.owner}</p>
        )}
        <p>المقر: {BUSINESS_INFO.city}</p>
        {FREELANCE_DOC_NUMBER.trim().length > 0 && (
          <p>موثّق بوثيقة العمل الحر رقم: {FREELANCE_DOC_NUMBER}</p>
        )}
        <p>ساعات الرد: خلال أيام العمل، نسعى للرد خلال ٢٤ ساعة.</p>
      </Section>
    </PageShell>
  );
}
