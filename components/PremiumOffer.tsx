"use client";

import { useState } from "react";
import { PRODUCTS, formatSar, type ProductId } from "@/lib/products";

type StoryInput = {
  title: string;
  story: string;
  key_scene: string;
  image_prompt: string;
};

const ORDER: ProductId[] = ["illustrated", "extra_image"];

export default function PremiumOffer({ story }: { story: StoryInput }) {
  const [selected, setSelected] = useState<ProductId | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    if (!selected || !email.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected,
          email: email.trim(),
          story: {
            title: story.title,
            paragraphs: story.story.split(/\n+/).map((p) => p.trim()).filter(Boolean),
            key_scene: story.key_scene,
            image_prompt: story.image_prompt,
          },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? "تعذّر بدء الدفع.");
      }
      window.location.href = data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر بدء الدفع.");
      setLoading(false);
    }
  }

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
              onClick={() => setSelected(id)}
              className={`flex items-center justify-between rounded-2xl border-2 bg-white px-4 py-3 text-right transition ${
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
            disabled={loading || !email.trim()}
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
