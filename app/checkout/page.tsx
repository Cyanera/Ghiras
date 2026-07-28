import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import CheckoutForm from "@/components/CheckoutForm";
import { getProduct, DELIVERY_NOTE } from "@/lib/services";

export const metadata: Metadata = {
  title: "إتمام الطلب — غِراس",
  description: "أكملي طلب خدمتك الرقمية من غِراس.",
  robots: { index: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productId } = await searchParams;
  const product = getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <PageShell title="إتمام الطلب" subtitle="مراجعة تفاصيل الخدمة ثم إتمام الطلب.">
      <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
        {/* ملخّص الطلب */}
        <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-line bg-white p-6 shadow-[0_14px_44px_-18px_rgba(42,37,48,0.22)]">
          <span className="text-sm font-medium text-ink-soft">ملخّص الطلب</span>
          <h2 className="text-xl font-black text-ink">{product.name}</h2>
          <p className="text-sm leading-relaxed text-ink-soft">{product.tagline}</p>

          <ul className="flex flex-col gap-2">
            {product.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="mt-0.5 shrink-0 font-black text-grass">✔</span>
                <span className="text-ink">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-center justify-between border-t border-line pt-4">
            <span className="font-bold text-ink">الإجمالي</span>
            <span className="text-2xl font-black text-ink">
              {product.price} <span className="text-base font-bold text-ink-soft">ر.س</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-ink-soft">{DELIVERY_NOTE}</p>

          <Link
            href="/khadamat"
            className="text-sm font-medium text-blue-deep underline-offset-4 hover:underline"
          >
            ← تغيير الخدمة
          </Link>
        </aside>

        {/* النموذج والدفع */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_14px_44px_-18px_rgba(42,37,48,0.22)] sm:p-8">
          <CheckoutForm product={product} />
        </div>
      </div>
    </PageShell>
  );
}
