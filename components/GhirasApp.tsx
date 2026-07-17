"use client";

import { useRef, useState } from "react";
import { AGE_GROUPS, VALUES, type Story } from "@/lib/schema";
import PremiumOffer from "./PremiumOffer";

type AgeGroup = (typeof AGE_GROUPS)[number];
type Value = (typeof VALUES)[number];

const AGE_LABELS: Record<AgeGroup, string> = {
  "3-4": "٣–٤ سنوات",
  "5-6": "٥–٦ سنوات",
  "7-8": "٧–٨ سنوات",
};

/* تناوب ألوان الهوية الثلاثة على الخيارات */
const GOLD = { on: "border-gold bg-gold text-ink font-bold", off: "bg-white border-gold/60 hover:bg-gold/15" };
const BLUE = { on: "border-blue-deep bg-blue-deep text-white font-bold", off: "bg-white border-blue/50 hover:bg-blue/10" };
const ROSE = { on: "border-rose-deep bg-rose-deep text-white font-bold", off: "bg-white border-rose/50 hover:bg-rose/10" };

const PALETTE = [GOLD, BLUE, ROSE];
const AGE_STYLES = [GOLD, BLUE, ROSE];

const CUSTOM = "__custom__";

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

  const effectiveValue = value === CUSTOM ? customValue.trim() : value;

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
        className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-line bg-white p-6 shadow-[0_14px_44px_-18px_rgba(42,37,48,0.22)] sm:p-8"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="heroName" className="font-bold">
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
            className="rounded-2xl border border-line bg-page px-4 py-3 outline-none transition placeholder:text-ink-soft/50 focus:border-blue focus:bg-white"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-bold">عمر الطفل</legend>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((age, i) => (
              <label
                key={age}
                className={`cursor-pointer rounded-full border-2 px-5 py-2 font-medium transition ${
                  ageGroup === age ? AGE_STYLES[i].on : AGE_STYLES[i].off
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
          <legend className="mb-2 font-bold">القيمة التي نغرسها اليوم</legend>
          <div className="flex flex-wrap gap-2">
            {VALUES.map((v, i) => (
              <label
                key={v}
                className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-medium transition sm:text-base ${
                  value === v ? PALETTE[i % 3].on : PALETTE[i % 3].off
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
              className={`cursor-pointer rounded-full border-2 border-dashed px-4 py-2 text-sm font-medium transition sm:text-base ${
                value === CUSTOM
                  ? "border-blue-deep bg-blue-deep font-bold text-white"
                  : "bg-white border-ink-soft/40 hover:border-blue hover:bg-blue/10"
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
              className="mt-1 rounded-2xl border border-line bg-page px-4 py-3 outline-none transition placeholder:text-ink-soft/50 focus:border-blue focus:bg-white"
            />
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="details" className="font-bold">
            تفاصيل إضافية <span className="text-sm font-normal text-ink-soft">(اختياري)</span>
          </label>
          <textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={400}
            rows={2}
            placeholder="مثال: يحب القطط، القصة في المدرسة، نهاية سعيدة…"
            className="resize-none rounded-2xl border border-line bg-page px-4 py-3 outline-none transition placeholder:text-ink-soft/50 focus:border-blue focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-gradient flex items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
          <p role="alert" className="rounded-2xl bg-red-soft px-4 py-3 text-center">
            {storyError}
          </p>
        )}
      </form>

      {/* النتيجة */}
      {story && (
        <div
          ref={resultRef}
          className="mx-auto mt-10 flex w-full max-w-2xl scroll-mt-6 flex-col gap-6 rounded-3xl border border-line bg-white p-6 shadow-[0_14px_44px_-18px_rgba(42,37,48,0.22)] sm:p-10"
        >
          <h2 className="text-center text-3xl font-black text-ink sm:text-4xl">
            {story.title}
          </h2>

          {/* الصورة */}
          <div className="overflow-hidden rounded-3xl bg-blue-soft">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={story.key_scene}
                className="aspect-[3/2] w-full object-cover"
              />
            ) : imageLoading ? (
              <div className="flex aspect-[3/2] w-full animate-pulse flex-col items-center justify-center gap-3 text-blue-deep">
                <Spinner large />
                <span className="font-medium">نرسم المشهد…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <span className="text-ink-soft">{imageError ?? "الصورة غير متوفرة."}</span>
                <button
                  type="button"
                  onClick={() => loadImage(story.image_prompt)}
                  className="rounded-full border-2 border-blue px-5 py-2 font-medium text-blue-deep transition hover:bg-blue hover:text-white"
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

          <p className="rounded-2xl bg-gold-soft px-5 py-4 text-center font-medium">
            {story.moral}
          </p>

          {/* هوامش الاستشهادات الموثّقة */}
          {story.citations.length > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-page px-5 py-4">
              {story.citations.map((c, i) => (
                <p key={i} className="text-sm leading-relaxed text-ink-soft">
                  <span className="text-ink">{c.text}</span>
                  <span className="mx-1">—</span>
                  <span className={c.kind === "quran" ? "text-grass" : "text-blue-deep"}>
                    {c.reference}
                  </span>
                </p>
              ))}
            </div>
          )}

          {/* الخدمات المدفوعة الاختيارية */}
          <PremiumOffer
            story={{
              title: story.title,
              story: story.story,
              key_scene: story.key_scene,
              image_prompt: story.image_prompt,
            }}
          />

          {/* الأزرار */}
          <div className="flex flex-wrap justify-center gap-3">
            <ActionButton onClick={copyStory}>
              {copied ? "تم النسخ ✓" : "انسخ القصة"}
            </ActionButton>
            <ActionButton
              onClick={() => loadImage(story.image_prompt)}
              disabled={imageLoading}
            >
              أعد توليد الصورة
            </ActionButton>
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
      className={`rounded-full px-5 py-2.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "btn-gradient text-white"
          : "border border-line bg-white hover:border-blue"
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
