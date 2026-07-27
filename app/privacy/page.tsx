import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section, List } from "@/components/PageShell";
import { BUSINESS_INFO, ORDER_EMAIL } from "@/lib/services";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — غِراس",
  description: "كيف نتعامل مع بياناتك في منصّة غِراس.",
};

export default function PrivacyPage() {
  return (
    <PageShell title="سياسة الخصوصية" updated={BUSINESS_INFO.policyUpdated}>
      <Section title="التزامنا بخصوصيتك">
        <p>
          نحترم خصوصيتك ونحرص على حماية بياناتك. توضّح هذه السياسة البيانات التي
          نتعامل معها وكيفية استخدامها.
        </p>
      </Section>

      <Section title="البيانات التي نجمعها">
        <List
          items={[
            "مولّد القصة المجاني لا يتطلّب تسجيل دخول، ولا نحفظ القصص التي تنشئينها.",
            "عند طلب خدمة مدفوعة نجمع ما تزوّدينا به: الاسم، بريدك الإلكتروني، وتفاصيل الطلب.",
            "بيانات تحليلية مجهّلة عن استخدام الموقع لتحسين الأداء (عبر Vercel Analytics).",
          ]}
        />
      </Section>

      <Section title="كيف نستخدم بياناتك">
        <List
          items={[
            "تنفيذ طلبك وتسليم الخدمة الرقمية إليك.",
            "التواصل معك بخصوص طلبك أو استفساراتك.",
            "تحسين جودة الموقع وخدماتنا.",
          ]}
        />
      </Section>

      <Section title="مشاركة البيانات والمدفوعات">
        <p>
          لا نبيع بياناتك ولا نشاركها لأغراض تسويقية. عند تفعيل الدفع الإلكتروني
          تُعالَج بيانات الدفع مباشرةً لدى بوابة دفع آمنة معتمدة، ولا نطّلع على
          بيانات بطاقتك ولا نخزّنها.
        </p>
      </Section>

      <Section title="حقوقك">
        <p>
          يحقّ لك طلب الاطّلاع على بياناتك أو تصحيحها أو حذفها، وذلك بمراسلتنا على{" "}
          <a href={`mailto:${ORDER_EMAIL}`} className="font-bold text-blue-deep underline-offset-4 hover:underline">
            {ORDER_EMAIL}
          </a>
          . لمزيد من التفاصيل راجعي{" "}
          <Link href="/terms" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            الشروط والأحكام
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
