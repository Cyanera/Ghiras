"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadDelivery,
  loadOrderStory,
  saveDelivery,
  type StoredStory,
} from "@/lib/story-store";

type Delivered = { caption: string; image: string };

type Phase = "checking" | "needStory" | "working" | "done" | "emailed" | "error";

export default function OrderDelivery({
  paymentId,
  productId,
  productName,
}: {
  paymentId: string;
  productId: string;
  productName: string;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [images, setImages] = useState<Delivered[]>([]);
  const [failed, setFailed] = useState(0);
  const [emailed, setEmailed] = useState(false);
  const [error, setError] = useState("");
  const [pasted, setPasted] = useState("");
  const [pastedTitle, setPastedTitle] = useState("");

  // التوليد يستهلك رصيدًا، فنحرص أن يبدأ مرة واحدة لا مع كل رسم للمكوّن.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // صور سُلِّمت سابقًا لنفس الطلب: نعرضها بلا إعادة توليد.
    const cached = loadDelivery(paymentId);
    if (cached) {
      setImages(cached);
      setPhase("done");
      return;
    }

    // القصة قد تكون محفوظة على الخادم مع الطلب، فنُحاول دائمًا:
    // إن لم يجدها الخادم أجاب needStory وطلبناها من المشتري.
    void run(loadOrderStory() ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  async function run(story?: StoredStory) {
    setPhase("working");
    setError("");

    try {
      const res = await fetch("/api/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, story }),
      });

      const data = (await res.json()) as {
        status?: "delivered" | "already" | "needStory";
        images?: Delivered[];
        failed?: number;
        emailed?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "تعذّر إنجاز الخدمة الآن.");
        setPhase("error");
        return;
      }

      // الخادم لا يملك القصة (ولا المتصفح) — نطلبها من المشترية.
      if (data.status === "needStory") {
        setPhase("needStory");
        return;
      }

      // أنجزه إشعار ميسر قبل أن تُفتح الصفحة: الصور في بريدها.
      if (data.status === "already") {
        setPhase("emailed");
        return;
      }

      if (!data.images?.length) {
        setError(data.error ?? "تعذّر إنجاز الخدمة الآن.");
        setPhase("error");
        return;
      }

      setImages(data.images);
      setFailed(data.failed ?? 0);
      setEmailed(Boolean(data.emailed));
      saveDelivery(paymentId, data.images);
      setPhase("done");
    } catch {
      setError("تعذّر الاتصال بالخدمة. تحققي من الشبكة وحاولي مرة أخرى.");
      setPhase("error");
    }
  }

  function submitPasted() {
    const text = pasted.trim();
    if (text.length < 40) {
      setError("الصقي نص القصة كاملًا (أطول من ذلك).");
      return;
    }
    void run({
      title: pastedTitle.trim() || "قصة غِراس",
      story: text,
      key_scene: "",
      image_prompt: "",
    });
  }

  const box =
    "flex flex-col gap-4 rounded-3xl border border-line bg-white p-6 shadow-[0_14px_44px_-18px_rgba(42,37,48,0.22)]";
  const field =
    "rounded-2xl border border-line bg-page px-4 py-3 outline-none transition placeholder:text-ink-soft/50 focus:border-blue focus:bg-white";

  if (phase === "checking") {
    return (
      <div className={box}>
        <p className="text-center text-ink-soft">نُحضّر طلبك…</p>
      </div>
    );
  }

  if (phase === "working") {
    const many = productId === "full-illustrated";
    return (
      <div className={box}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue/30 border-t-blue-deep" />
          <p className="font-bold text-ink">
            {many ? "نرسم صفحات القصة…" : "نرسم صورتك…"}
          </p>
          <p className="text-sm leading-relaxed text-ink-soft">
            {many
              ? "قد تستغرق دقيقتين. أبقي هذه الصفحة مفتوحة."
              : "قد تستغرق نصف دقيقة. أبقي هذه الصفحة مفتوحة."}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "needStory") {
    return (
      <div className={box}>
        <h3 className="font-black text-ink">نحتاج نصّ القصة</h3>
        <p className="text-sm leading-relaxed text-ink-soft">
          لم نجد القصة في هذا المتصفح — قد تكون أنشأتِها على جهاز أو متصفح آخر.
          الصقيها هنا ونُكمل «{productName}» فورًا.
        </p>

        <input
          type="text"
          value={pastedTitle}
          onChange={(e) => setPastedTitle(e.target.value)}
          maxLength={200}
          placeholder="عنوان القصة (اختياري)"
          className={field}
        />
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={8}
          maxLength={8000}
          placeholder="الصقي نص القصة كاملًا هنا…"
          className={`resize-y ${field}`}
        />

        {error && (
          <p role="alert" className="text-sm font-medium text-rose-deep">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submitPasted}
          className="btn-gradient rounded-full px-6 py-3.5 font-bold text-white"
        >
          أكملي الخدمة
        </button>
      </div>
    );
  }

  if (phase === "emailed") {
    return (
      <div className={box}>
        <p className="text-4xl">📬</p>
        <h3 className="font-black text-ink">أرسلناها على بريدك</h3>
        <p className="text-sm leading-relaxed text-ink-soft">
          أُنجزت «{productName}» وأُرسلت إلى بريدك الإلكتروني. تحققي من صندوق
          الوارد — وإن لم تجديها فانظري في «المهملات» أو راسلينا برقم الطلب.
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={box}>
        <p className="leading-relaxed text-ink">{error}</p>
        <p className="text-sm leading-relaxed text-ink-soft">
          دفعتك محفوظة ولن تُخصم مرة أخرى. يمكنك المحاولة، أو مراسلتنا برقم الطلب.
        </p>
        <button
          type="button"
          onClick={() => void run(loadOrderStory() ?? undefined)}
          className="rounded-full bg-blue-deep px-6 py-3 font-bold text-white transition hover:brightness-110"
        >
          أعيدي المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className={box}>
      <div className="flex flex-col gap-1">
        <h3 className="font-black text-ink">
          {images.length > 1 ? `صور قصتك (${images.length})` : "صورتك جاهزة"}
        </h3>
        <p className="text-sm leading-relaxed text-ink-soft">
          اضغطي على «تنزيل» لحفظ الصورة على جهازك.
          {emailed && " وأرسلنا نسخة على بريدك."}
        </p>
      </div>

      <div className={images.length > 1 ? "grid gap-5 sm:grid-cols-2" : "flex flex-col gap-5"}>
        {images.map((img, i) => (
          <figure key={i} className="flex flex-col gap-2">
            <div className="overflow-hidden rounded-2xl bg-blue-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image}
                alt={img.caption}
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <figcaption className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-soft">{img.caption}</span>
              <a
                href={img.image}
                download={
                  images.length > 1 ? `ghiras-${i + 1}.png` : "ghiras.png"
                }
                className="shrink-0 rounded-full border-2 border-blue px-4 py-1.5 text-sm font-bold text-blue-deep transition hover:bg-blue hover:text-white"
              >
                تنزيل
              </a>
            </figcaption>
          </figure>
        ))}
      </div>

      {failed > 0 && (
        <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm leading-relaxed text-ink">
          تعذّر رسم {failed} من الصور. راسلينا برقم الطلب ونُكملها لك دون أي مقابل.
        </p>
      )}
    </div>
  );
}
