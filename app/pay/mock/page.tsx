"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function MockPayInner() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mock-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) throw new Error();
      router.push(`/order/${orderId}`);
    } catch {
      setError("تعذّر تأكيد الدفع التجريبي.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-full rounded-3xl border border-line bg-white p-8 shadow-[0_14px_44px_-18px_rgba(42,37,48,0.22)]">
        <div className="mb-2 inline-block rounded-full bg-gold-soft px-4 py-1 text-sm font-bold text-ink">
          وضع تجريبي
        </div>
        <h1 className="text-2xl font-black">محاكاة الدفع</h1>
        <p className="mt-2 text-ink-soft">
          هذه صفحة دفع تجريبية للتطوير — لا يُخصم أي مبلغ حقيقي.
        </p>
        <button
          onClick={confirm}
          disabled={loading || !orderId}
          className="btn-gradient mt-6 w-full rounded-full px-6 py-4 text-lg font-bold text-white disabled:opacity-50"
        >
          {loading ? "جارٍ التأكيد…" : "تأكيد الدفع (تجريبي)"}
        </button>
        {error && <p className="mt-4 text-rose-deep">{error}</p>}
      </div>
    </main>
  );
}

export default function MockPayPage() {
  return (
    <Suspense fallback={null}>
      <MockPayInner />
    </Suspense>
  );
}
