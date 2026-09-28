import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section, List } from "@/components/PageShell";
import { BUSINESS_INFO, ORDER_EMAIL } from "@/lib/services";
import { RETENTION_DAYS } from "@/lib/order-store";

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
            "مولّد القصة المجاني لا يتطلّب تسجيل دخول، ولا نحفظ القصص التي تنشئينها فيه.",
            "عند طلب خدمة مدفوعة نجمع ما تزوّدينا به: الاسم، بريدك الإلكتروني، اسم الطفل، وتفاصيل الطلب.",
            "بيانات تحليلية مجهّلة عن استخدام الموقع لتحسين الأداء (عبر Vercel Analytics).",
          ]}
        />
      </Section>

      <Section title="ما نحفظه عند الطلب المدفوع ومدّته">
        <p>
          لكي تُسلَّم خدمتك تلقائيًا على بريدك حتى لو أغلقتِ الموقع بعد الدفع،
          نحفظ مؤقتًا بيانات طلبك ونصّ القصة المرتبطة به على خادمٍ آمن.
        </p>
        <List
          items={[
            `يُحذف الطلب المحفوظ تلقائيًا بعد ${RETENTION_DAYS} يومًا، ويُحذف قبل ذلك بمجرّد إتمام التسليم على بريدك.`,
            "لا نستخدم هذه البيانات لغير تنفيذ طلبك والتواصل معك بشأنه.",
            "لا نحفظ الصور المُسلَّمة على خدمتنا؛ تُرسل إليك وتبقى نسختك عندك.",
            "يمكنك طلب حذف بياناتك في أي وقت بمراسلتنا.",
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
