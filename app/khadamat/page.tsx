import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";
import {
  PRODUCTS,
  DELIVERY_NOTE,
  EMAIL_NOTE,
  FREELANCE_DOC_NUMBER,
  type Product,
} from "@/lib/services";
import { isEmailConfigured } from "@/lib/email";

export const metadata: Metadata = {
  title: "خدمات غِراس — صور ورسومات مخصّصة لقصص أطفالكم",
  description:
    "خدمات غِراس الرقمية: صورة إضافية للقصة، رسمة تشبه ملامح طفلك، وتحويل القصة إلى قصة مصوّرة كاملة. تُسلَّم فورًا.",
  openGraph: {
    title: "خدمات غِراس — صور ورسومات مخصّصة لقصص أطفالكم",
    description:
      "صورة إضافية للقصة، رسمة تشبه ملامح طفلك، وتحويل القصة إلى قصة مصوّرة كاملة. تُسلَّم فورًا.",
    url: "https://ghiras.kids/khadamat",
    siteName: "غِراس",
    locale: "ar",
    type: "website",
  },
};

const ACCENTS = {
  gold: { ring: "border-gold", chip: "bg-gold-soft text-ink", check: "text-gold", btn: "bg-gold text-ink hover:brightness-105" },
  blue: { ring: "border-blue", chip: "bg-blue-soft text-blue-deep", check: "text-blue-deep", btn: "bg-blue-deep text-white hover:brightness-110" },
  rose: { ring: "border-rose", chip: "bg-rose-soft text-rose-deep", check: "text-rose-deep", btn: "bg-rose-deep text-white hover:brightness-110" },
} as const;

export default function KhadamatPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-10 sm:py-14">
      {/* رأس الصفحة */}
      <header className="flex flex-col items-center gap-2 text-center">
        <Link href="/" aria-label="العودة إلى غِراس">
          <Logo className="h-20 w-20 sm:h-24 sm:w-24" />
        </Link>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-ink sm:text-5xl">
          خدمات غِراس
        </h1>
        <p className="mt-1 max-w-xl text-lg font-medium text-ink-soft sm:text-xl">
          لمساتٌ مصوّرة تجعل قصة الطفل أجمل وأقرب إلى قلبه.
        </p>

        {FREELANCE_DOC_NUMBER.trim().length > 0 && (
          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-sm text-ink-soft">
            <span className="text-grass">✔</span>
            عملٌ موثّق بوثيقة العمل الحر — رقم {FREELANCE_DOC_NUMBER}
          </span>
        )}
      </header>

      {/* تنويه: الأداة المجانية تبقى متاحة */}
      <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-blue-soft px-5 py-4 text-center sm:flex-row sm:text-start">
        <p className="text-sm leading-relaxed text-ink sm:text-base">
          مولّد القصة القصيرة مع صورةٍ واحدة مجانيٌّ دائمًا. والخدمات أدناه إضافاتٌ اختيارية لإثراء القصة.
        </p>
        <Link
          href="/"
          className="shrink-0 rounded-full border-2 border-blue px-4 py-2 text-sm font-bold text-blue-deep transition hover:bg-blue hover:text-white"
        >
          إنشاء قصة مجانًا
        </Link>
      </div>

      {/* الخدمات */}
      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {PRODUCTS.map((product: Product) => {
          const a = ACCENTS[product.accent];
          return (
            <article
              key={product.id}
              className={`relative flex flex-col gap-5 rounded-3xl border-2 bg-white p-6 shadow-[0_14px_44px_-18px_rgba(42,37,48,0.22)] ${
                product.featured ? `${a.ring} md:-translate-y-3` : "border-line"
              }`}
            >
              {product.featured && (
                <span className="absolute -top-3 right-6 rounded-full bg-blue-deep px-4 py-1 text-sm font-bold text-white shadow">
                  الأكثر طلبًا
                </span>
              )}

              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-ink">{product.name}</h2>
                <p className="text-sm leading-relaxed text-ink-soft">{product.tagline}</p>
              </div>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-ink">{product.price}</span>
                <span className="pb-1 font-bold text-ink-soft">ر.س</span>
                <span className={`mb-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${a.chip}`}>
                  رقمي فوري
                </span>
              </div>

              <ul className="flex flex-col gap-2.5">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className={`mt-0.5 shrink-0 font-black ${a.check}`}>✔</span>
                    <span className="text-ink">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2">
                <Link
                  href={`/checkout?product=${product.id}`}
                  className={`block rounded-full px-5 py-3 text-center font-bold transition ${a.btn}`}
                >
                  طلب هذه الخدمة
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {DELIVERY_NOTE}
        {isEmailConfigured() && ` ${EMAIL_NOTE}`}
      </p>

      <SiteFooter />
    </main>
  );
}
