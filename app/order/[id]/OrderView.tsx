"use client";

import { useEffect, useState } from "react";

type OrderState = {
  status: "pending" | "paid" | "fulfilled" | "failed";
  product: { id: string; title: string } | null;
  storyTitle: string;
  result: { images: string[] } | null;
  error: string | null;
};

export default function OrderView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderState | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        const data = (await res.json()) as OrderState;
        if (!active) return;
        setOrder(data);
        if (data.status !== "fulfilled" && data.status !== "failed") {
          timer = setTimeout(poll, 3000);
        }
      } catch {
        if (active) timer = setTimeout(poll, 4000);
      }
    }
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [orderId]);

  if (notFound) {
    return <Centered>الطلب غير موجود.</Centered>;
  }
  if (!order) {
    return <Centered>جارٍ التحميل…</Centered>;
  }

  const working = order.status === "pending" || order.status === "paid";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center px-4 py-12">
      <h1 className="text-center text-3xl font-black text-ink">
        {order.product?.title ?? "خدمتك"}
      </h1>
      <p className="mt-1 text-ink-soft">قصة «{order.storyTitle}»</p>

      {working && (
        <div className="mt-10 flex flex-col items-center gap-4 text-blue-deep">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <p className="font-medium">نجهّز قصتك المصوّرة… قد يستغرق دقيقة.</p>
          <p className="text-sm text-ink-soft">
            ستصلك نسخة على بريدك أيضًا فور جاهزيتها.
          </p>
        </div>
      )}

      {order.status === "failed" && (
        <div className="mt-10 rounded-2xl bg-red-soft px-6 py-4 text-center">
          حدث خطأ أثناء التجهيز. تواصلي معنا وسنعوّضك.
        </div>
      )}

      {order.status === "fulfilled" && order.result && (
        <div className="mt-8 flex w-full flex-col gap-5">
          {order.result.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`مشهد ${i + 1}`}
              className="w-full rounded-3xl border border-line"
            />
          ))}
          <p className="text-center text-sm text-ink-soft">
            💛 أُرسلت نسخة إلى بريدك أيضًا.
          </p>
        </div>
      )}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center text-ink-soft">
      {children}
    </main>
  );
}
