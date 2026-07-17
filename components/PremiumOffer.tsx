"use client";

import { useRef, useState } from "react";
import { PRODUCTS, formatSar, type ProductId } from "@/lib/products";

type StoryInput = {
  title: string;
  story: string;
  key_scene: string;
  image_prompt: string;
};

const ORDER: ProductId[] = ["illustrated", "likeness"];

// يصغّر الصورة إلى ~1024px ويحوّلها إلى JPEG data URL لتقليل الحجم.
function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("img"));
      img.onload = () => {
        const max = 1024;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("ctx"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PremiumOffer({ story }: { story: StoryInput }) {
  const [selected, setSelected] = useState<ProductId | null>(null);
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const product = selected ? PRODUCTS[selected] : null;
  const needsPhoto = product?.needsPhoto ?? false;

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12_000_000) {
      setError("الصورة كبيرة جدًا (الحد 12 ميغابايت).");
      return;
    }
    setError(null);
    try {
      setPhoto(await downscaleImage(file));
    } catch {
      setError("تعذّر قراءة الصورة. جرّبي صورة أخرى.");
    }
  }

  function reset() {
    setPhoto(null);
    setConsent(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function buy() {
    if (!selected || !email.trim() || loading) return;
    if (needsPhoto && (!photo || !consent)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected,
          email: email.trim(),
          ...(needsPhoto && photo ? { photo } : {}),
          story: {
            title: story.title,
            paragraphs: story.story.split(/\n+/).map((p) => p.trim()).filter(Boolean),
            key_scene: story.key_scene,
            image_prompt: story.image_prompt,
          },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error ?? "تعذّر بدء الدفع.");
      window.location.href = data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر بدء الدفع.");
      setLoading(false);
    }
  }

  const canBuy =
    !!email.trim() && (!needsPhoto || (!!photo && consent)) && !loading;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border-2 border-dashed border-gold bg-gold-soft/40 p-5 sm:p-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-ink">✨ أضيفي لمسة خاصة</h3>
        <p className="mt-1 text-sm text-ink-soft">
          القصة مجانية دائمًا — وهذه هدايا اختيارية لطفلك.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {ORDER.map((id) => {
          const p = PRODUCTS[id];
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSelected(id);
                reset();
              }}
              className={`flex items-center justify-between gap-3 rounded-2xl border-2 bg-white px-4 py-3 text-right transition ${
                active ? "border-blue-deep" : "border-line hover:border-blue"
              }`}
            >
              <span className="flex flex-col">
                <span className="font-bold">{p.title}</span>
                <span className="text-sm text-ink-soft">{p.description}</span>
              </span>
              <span className="shrink-0 rounded-full bg-blue-soft px-3 py-1 font-bold text-blue-deep">
                {formatSar(p.amount)}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex flex-col gap-3">
          {needsPhoto && (
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
              <label className="font-bold">صورة طفلك</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickPhoto}
                className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blue file:px-4 file:py-2 file:font-bold file:text-white"
              />
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="معاينة"
                  className="h-24 w-24 rounded-2xl object-cover"
                />
              )}
              <label className="flex items-start gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  أوافق كوليّ أمر على استخدام صورة طفلي لإنشاء الرسمة، وأعلم أنها
                  <b> تُحذف فورًا بعد الإنشاء ولا تُخزَّن</b>.
                </span>
              </label>
            </div>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="بريدك لإرسال النتيجة إليه"
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition placeholder:text-ink-soft/50 focus:border-blue"
          />
          <button
            type="button"
            onClick={buy}
            disabled={!canBuy}
            className="btn-gradient rounded-full px-6 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جارٍ التحويل للدفع…" : "ادفعي واحصلي عليها"}
          </button>
          {error && (
            <p className="rounded-2xl bg-red-soft px-4 py-3 text-center text-sm">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
