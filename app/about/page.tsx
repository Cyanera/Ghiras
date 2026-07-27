import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section, List } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "من نحن — غِراس",
  description:
    "غِراس منصّة عربية تصنع قصصًا وكتبًا مخصّصة للأطفال تغرس فيهم القيم الجميلة بأسلوب إسلامي.",
};

export default function AboutPage() {
  return (
    <PageShell
      title="من نحن"
      subtitle="قصصٌ تُروى، وقيمٌ تُغرس."
    >
      <Section title="رسالتنا">
        <p>
          غِراس منصّة عربية تصنع قصصًا وكتبًا مخصّصة للأطفال، هدفها أن تغرس في
          الصغار القيم الجميلة — كالصدق والرحمة وبر الوالدين — عبر حكايات محبّبة
          باسم الطفل نفسه، وبأسلوب إسلامي يستند إلى القرآن والسنة.
        </p>
        <p>
          نؤمن أن القيمة حين تُروى في قصة يعيشها الطفل تبقى في قلبه أطول مما لو
          لُقّنت تلقينًا. فكل قصة نصنعها تجعل طفلك بطلها، وتزرع فيه معنى يكبر معه.
        </p>
      </Section>

      <Section title="ماذا نقدّم؟">
        <List
          items={[
            "مولّد قصة قصيرة مجاني متاح للجميع مباشرةً على الموقع.",
            "قصص مخصّصة مطوّلة بعدة مشاهد مصوّرة باسم طفلك.",
            "كتب قيم مصوّرة كاملة بغلاف يحمل اسم الطفل.",
            "نسخ مطبوعة فاخرة تُهدى في المناسبات.",
            "باقات خاصة للمدارس والحضانات ومبادرات الأطفال.",
          ]}
        />
      </Section>

      <Section title="التزامنا">
        <p>
          نحرص على أن يكون كل محتوى نقدّمه سليمًا لغويًا وقيميًا، وأن تُراجع
          الاستشهادات الدينية وتوثَّق من مصادرها. رضاك عن العمل هو معيارنا، ولذلك
          نتيح المراجعة والتعديل ضمن كل باقة.
        </p>
        <p>
          للتعرّف على باقاتنا وأسعارها يمكنك زيارة{" "}
          <Link href="/khadamat" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            صفحة الخدمات
          </Link>
          ، ولأي استفسار تواصلي معنا عبر{" "}
          <Link href="/contact" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            صفحة التواصل
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
