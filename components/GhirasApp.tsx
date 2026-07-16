"use client";

import { useRef, useState } from "react";
import { AGE_GROUPS, VALUES, type Story } from "@/lib/schema";

type AgeGroup = (typeof AGE_GROUPS)[number];
type Value = (typeof VALUES)[number];

const AGE_LABELS: Record<AgeGroup, string> = {
  "3-4": "٣–٤ سنوات",
  "5-6": "٥–٦ سنوات",
  "7-8": "٧–٨ سنوات",
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data as { error?: string } | null)?.error ?? "حدث خطأ غير متوقع. حاولي مرة أخرى."
    );
  }
  return data as T;
}

const CUSTOM = "__custom__";

export default function GhirasApp() {
  const [heroName, setHeroName] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [value, setValue] = useState<Value | typeof CUSTOM | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [details, setDetails] = useState("");

  const [story, setStory] = useState<Story | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  async function loadImage(imagePrompt: string) {
    setImage(null);
    setImageError(null);
    setImageLoading(true);
    try {
      const data = await postJson<{ image: string }>("/api/image", {
        image_prompt: imagePrompt,
      });
      setImage(data.image);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "تعذّر رسم الصورة الآن.");
    } finally {
      setImageLoading(false);
    }
  }

  const effectiveValue = value === CUSTOM ? customValue.trim() : value;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!heroName.trim() || !ageGroup || !effectiveValue || storyLoading) return;

    setStory(null);
    setImage(null);
    setImageError(null);
    setStoryError(null);
    setCopied(false);
    setStoryLoading(true);

    try {
      const data = await postJson<Story>("/api/story", {
        heroName: heroName.trim(),
        ageGroup,
        value: effectiveValue,
        details: details.trim(),
      });
      setStory(data);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
      void loadImage(data.image_prompt);
    } catch (err) {
      setStoryError(err instanceof Error ? err.message : "تعذّر توليد القصة الآن.");
    } finally {
      setStoryLoading(false);
    }
  }

  function resetAll() {
    setStory(null);
    setImage(null);
    setImageError(null);
    setStoryError(null);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyStory() {
    if (!story) return;
    const text = `${story.title}\n\n${story.story}\n\n${story.moral}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStoryError("تعذّر النسخ. يمكنك تحديد النص ونسخه يدويًا.");
    }
  }

  const canSubmit =
    heroName.trim().length > 0 && !!ageGroup && !!effectiveValue && !storyLoading;

  return (
    <div className="w-full">
      {/* النموذج */}
      <form
        onSubmit={handleSubmit}
        className="no-print mx-auto flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-sand bg-white/80 p-6 shadow-[0_10px_40px_-15px_rgba(95,138,110,0.25)] sm:p-8"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="heroName" className="font-medium">
            اسم بطل القصة
          </label>
          <input
            id="heroName"
            type="text"
            value={heroName}
            onChange={(e) => setHeroName(e.target.value)}
            required
            maxLength={40}
            placeholder="مثال: سارة، حمد…"
            className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none transition placeholder:text-ink-soft/60 focus:border-leaf focus:bg-white"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">عمر الطفل</legend>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((age) => (
              <label
                key={age}
                className={`cursor-pointer rounded-full border px-5 py-2 transition ${
                  ageGroup === age
                    ? "border-leaf-deep bg-leaf-deep font-bold text-white"
                    : "border-sand bg-cream hover:border-leaf"
                }`}
              >
                <input
                  type="radio"
                  name="ageGroup"
                  value={age}
                  checked={ageGroup === age}
                  onChange={() => setAgeGroup(age)}
                  className="sr-only"
                  required
                />
                {AGE_LABELS[age]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">القيمة التي نغرسها اليوم</legend>
          <div className="flex flex-wrap gap-2">
            {VALUES.map((v) => (
              <label
                key={v}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition sm:text-base ${
                  value === v
                    ? "border-leaf-deep bg-leaf-deep font-bold text-white"
                    : "border-sand bg-cream hover:border-leaf"
                }`}
              >
                <input
                  type="radio"
                  name="value"
                  value={v}
                  checked={value === v}
                  onChange={() => setValue(v)}
                  className="sr-only"
                  required
                />
                {v}
              </label>
            ))}
            <label
              className={`cursor-pointer rounded-full border border-dashed px-4 py-2 text-sm transition sm:text-base ${
                value === CUSTOM
                  ? "border-leaf-deep bg-leaf-deep font-bold text-white"
                  : "border-ink-soft/40 bg-cream hover:border-leaf"
              }`}
            >
              <input
                type="radio"
                name="value"
                value={CUSTOM}
                checked={value === CUSTOM}
                onChange={() => setValue(CUSTOM)}
                className="sr-only"
              />
              + قيمة أخرى
            </label>
          </div>
          {value === CUSTOM && (
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              maxLength={30}
              autoFocus
              placeholder="اكتبي القيمة… مثال: بر الوالدين، حب القراءة"
              className="mt-1 rounded-2xl border border-sand bg-cream px-4 py-3 outline-none transition placeholder:text-ink-soft/60 focus:border-leaf focus:bg-white"
            />
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="details" className="font-medium">
            تفاصيل إضافية <span className="text-sm text-ink-soft">(اختياري)</span>
          </label>
          <textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={400}
            rows={2}
            placeholder="مثال: يحب القطط، القصة في المدرسة، نهاية سعيدة…"
            className="resize-none rounded-2xl border border-sand bg-cream px-4 py-3 outline-none transition placeholder:text-ink-soft/60 focus:border-leaf focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center justify-center gap-3 rounded-full bg-leaf-deep px-6 py-4 text-lg font-bold text-white transition hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-50"
        >
          {storyLoading ? (
            <>
              <Spinner />
              نكتب القصة الآن…
            </>
          ) : (
            "أنشئ القصة"
          )}
        </button>

        {storyError && (
          <p role="alert" className="rounded-2xl bg-blossom-soft px-4 py-3 text-center">
            {storyError}
          </p>
        )}
      </form>

      {/* النتيجة */}
      {story && (
        <div
          ref={resultRef}
          className="print-card mx-auto mt-10 flex w-full max-w-2xl scroll-mt-6 flex-col gap-6 rounded-3xl border border-sand bg-white/90 p-6 shadow-[0_10px_40px_-15px_rgba(95,138,110,0.25)] sm:p-10"
        >
          <h2 className="text-center text-3xl font-black text-leaf-deep sm:text-4xl">
            {story.title}
          </h2>

          {/* الصورة */}
          <div className="overflow-hidden rounded-3xl bg-leaf-soft">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={story.key_scene}
                className="aspect-[3/2] w-full object-cover"
              />
            ) : imageLoading ? (
              <div className="flex aspect-[3/2] w-full animate-pulse flex-col items-center justify-center gap-3 text-leaf-deep">
                <Spinner large />
                <span>نرسم المشهد…</span>
              </div>
            ) : (
              <div className="no-print flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <span className="text-ink-soft">{imageError ?? "الصورة غير متوفرة."}</span>
                <button
                  type="button"
                  onClick={() => loadImage(story.image_prompt)}
                  className="rounded-full border border-leaf-deep px-5 py-2 text-leaf-deep transition hover:bg-leaf hover:text-white"
                >
                  أعد توليد الصورة
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 text-lg leading-loose">
            {story.story.split(/\n+/).map(
              (paragraph, i) =>
                paragraph.trim() && <p key={i}>{paragraph.trim()}</p>
            )}
          </div>

          <p className="rounded-2xl bg-leaf-soft px-5 py-4 text-center text-leaf-deep">
            {story.moral}
          </p>

          {/* الأزرار */}
          <div className="no-print flex flex-wrap justify-center gap-3">
            <ActionButton onClick={copyStory}>
              {copied ? "تم النسخ ✓" : "انسخ القصة"}
            </ActionButton>
            <ActionButton
              onClick={() => loadImage(story.image_prompt)}
              disabled={imageLoading}
            >
              أعد توليد الصورة
            </ActionButton>
            <ActionButton onClick={() => window.print()}>اطبع</ActionButton>
            <ActionButton onClick={resetAll} primary>
              أنشئ قصة جديدة
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-leaf-deep text-white hover:bg-leaf"
          : "border border-sand bg-cream hover:border-leaf"
      }`}
    >
      {children}
    </button>
  );
}

function Spinner({ large }: { large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${
        large ? "h-8 w-8" : "h-5 w-5"
      }`}
    />
  );
}
