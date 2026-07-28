import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section, List } from "@/components/PageShell";
import { BUSINESS_INFO } from "@/lib/services";

export const metadata: Metadata = {
  title: "الشروط والأحكام — غِراس",
  description: "شروط استخدام منصّة غِراس وخدماتها الرقمية.",
};

export default function TermsPage() {
  return (
    <PageShell title="الشروط والأحكام" updated={BUSINESS_INFO.policyUpdated}>
      <Section title="مقدّمة">
        <p>
          مرحبًا بكم في غِراس. باستخدام الموقع أو طلب أيٍّ من خدماته، فإنكم توافقون
          على هذه الشروط والأحكام. يُرجى قراءتها بعناية.
        </p>
      </Section>

      <Section title="الخدمات">
        <p>
          يقدّم غِراس مولّد قصص أطفال مجانيًا، إضافةً إلى خدمات رقمية مدفوعة
          تشمل توليد صور إضافية للقصة، ورسمات تحاكي ملامح الطفل، وتحويل القصة إلى
          قصة مصوّرة كاملة. جميع الخدمات المدفوعة منتجات رقمية تُسلَّم إلكترونيًا.
        </p>
      </Section>

      <Section title="الاستخدام المقبول">
        <List
          items={[
            "تُستخدم الخدمة لأغراض شخصية وتعليمية لائقة بالأطفال.",
            "يُمنع استخدام المحتوى المولّد فيما يخالف الآداب العامة أو النظام.",
            "المحتوى المُولَّد بالذكاء الاصطناعي قد يحتاج مراجعتك قبل الاعتماد النهائي.",
          ]}
        />
      </Section>

      <Section title="الأسعار والدفع">
        <p>
          تُعرض أسعار الخدمات بالريال السعودي وتشمل ما يلزم من الرسوم. عند تفعيل
          الدفع الإلكتروني، تُعالَج المدفوعات عبر بوابة دفع آمنة معتمدة. وحتى ذلك
          الحين تُستقبل الطلبات عبر البريد الإلكتروني أو واتساب.
        </p>
      </Section>

      <Section title="الملكية الفكرية">
        <p>
          يحصل العميل على حقّ استخدام المحتوى المُنتَج له لأغراضه الشخصية. أما اسم
          «غِراس» وهويّته وتصميمه فمملوكة للمنصّة.
        </p>
      </Section>

      <Section title="حدود المسؤولية">
        <p>
          نبذل جهدنا لتقديم محتوى عالي الجودة، غير أن الخدمة تُقدَّم «كما هي». لا
          نتحمّل مسؤولية أي استخدام يخالف هذه الشروط.
        </p>
      </Section>

      <Section title="التعديلات والتواصل">
        <p>
          قد نحدّث هذه الشروط من وقتٍ لآخر، ويسري التحديث فور نشره. لأي استفسار
          يمكنك مراجعة{" "}
          <Link href="/refund" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            سياسة الاسترجاع
          </Link>{" "}
          و{" "}
          <Link href="/privacy" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            سياسة الخصوصية
          </Link>
          ، أو{" "}
          <Link href="/contact" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            التواصل معنا
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
