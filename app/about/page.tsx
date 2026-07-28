import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section, List } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "من نحن — غِراس",
  description:
    "غِراس منصّة عربية تولّد قصص أطفال مخصّصة بأسلوب إسلامي، وتقدّم خدمات صور رقمية تُثري القصة.",
};

export default function AboutPage() {
  return (
    <PageShell title="من نحن" subtitle="قصصٌ تُروى، وقيمٌ تُغرس.">
      <Section title="رسالتنا">
        <p>
          غِراس منصّة عربية تولّد قصص أطفال مخصّصة تجعل طفلك بطلها، وتغرس فيه القيم
          الجميلة — كالصدق والرحمة وبر الوالدين — بأسلوب إسلامي يستند إلى القرآن
          والسنة، مع صورةٍ تجسّد أجمل مشاهد القصة.
        </p>
        <p>
          نؤمن أن القيمة حين تُروى في قصة يعيشها الطفل تبقى في قلبه أطول مما لو
          لُقّنت تلقينًا.
        </p>
      </Section>

      <Section title="ماذا نقدّم؟">
        <p>مولّد القصة القصيرة مع صورةٍ واحدة مجانيٌّ للجميع. وإلى جانبه نقدّم خدمات رقمية اختيارية:</p>
        <List
          items={[
            "صورة إضافية للقصة — لمشهدٍ تختارينه.",
            "رسمة تشبه ملامح طفلك — ليصير بطل الصورة حقًّا.",
            "تحويل القصة إلى قصة مصوّرة كاملة — صورة لكل مشهد.",
          ]}
        />
        <p>جميعها منتجات رقمية تُسلَّم فورًا عبر الموقع وعلى البريد الإلكتروني.</p>
      </Section>

      <Section title="التزامنا">
        <p>
          نحرص على أن يكون كل محتوى نقدّمه سليمًا لغويًا وقيميًا، وأن تُوثَّق
          الاستشهادات الدينية من مصادرها. ورضا عملائنا عن العمل هو معيارنا.
        </p>
        <p>
          للاطّلاع على الخدمات وأسعارها، زوروا{" "}
          <Link href="/khadamat" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            صفحة الخدمات
          </Link>
          ، ولأي استفسار{" "}
          <Link href="/contact" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            تواصلوا معنا
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
