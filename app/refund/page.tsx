import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section, List } from "@/components/PageShell";
import { BUSINESS_INFO, ORDER_EMAIL } from "@/lib/services";

export const metadata: Metadata = {
  title: "سياسة الاسترجاع والاستبدال — غِراس",
  description: "سياسة الاسترجاع والاستبدال للخدمات الرقمية في غِراس.",
};

export default function RefundPage() {
  return (
    <PageShell title="سياسة الاسترجاع والاستبدال" updated={BUSINESS_INFO.policyUpdated}>
      <Section title="طبيعة الخدمات">
        <p>
          جميع خدمات غِراس المدفوعة منتجات رقمية مخصّصة تُنتَج بناءً على طلبك
          وتُسلَّم إلكترونيًا فور جاهزيتها. ولأنها تُصمَّم خصيصًا لك وتُسلَّم رقميًا،
          فإنها بطبيعتها غير قابلة للاسترجاع بعد التسليم.
        </p>
      </Section>

      <Section title="متى يحقّ لك الاسترجاع أو التعويض؟">
        <p>حرصًا على رضاك، نلتزم بمعالجة الحالات التالية:</p>
        <List
          items={[
            "تعذّر تسليم المنتج بسبب خلل تقني من طرفنا: نعيد التسليم أو نعيد المبلغ كاملًا.",
            "استلام منتج مختلف جوهريًا عمّا هو موصوف: نصحّحه أو نعيد المبلغ.",
            "وجود خلل واضح في الملف المسلَّم (تلف أو عدم اكتماله): نعيد إرساله فورًا.",
          ]}
        />
      </Section>

      <Section title="التعديلات والمراجعة">
        <p>
          نتيح تعديلاتٍ على العمل بما يتوافق مع تفاصيل طلبك الأصلي قبل اعتماده
          نهائيًا، لضمان حصولك على النتيجة التي تتوقّعينها.
        </p>
      </Section>

      <Section title="كيفية تقديم الطلب">
        <p>
          لطلب استرجاع أو استبدال، يُرجى مراسلتنا خلال ٧ أيام من استلام المنتج على{" "}
          <a href={`mailto:${ORDER_EMAIL}`} className="font-bold text-blue-deep underline-offset-4 hover:underline">
            {ORDER_EMAIL}
          </a>{" "}
          مع توضيح رقم الطلب والمشكلة، وسنردّ في أسرع وقت. وتُعاد المبالغ
          المستحقّة بنفس وسيلة الدفع خلال مدّة معالجة بوابة الدفع.
        </p>
        <p>
          للاطّلاع على بقية سياساتنا راجعي{" "}
          <Link href="/terms" className="font-bold text-blue-deep underline-offset-4 hover:underline">
            الشروط والأحكام
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
