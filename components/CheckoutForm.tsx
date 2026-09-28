"use client";

import { useEffect, useState } from "react";
import { buildOrderText, WHATSAPP_NUMBER, type Product } from "@/lib/services";
import { loadOrderStory } from "@/lib/story-store";

export default function CheckoutForm({
  product,
  paymentEnabled,
  testMode = false,
  emailEnabled = false,
}: {
  product: Product;
  /** يأتي من الخادم: هل مفاتيح ميسر مضبوطة؟ */
  paymentEnabled: boolean;
  /** مفاتيح تجريبية — نعرض تنويهًا كي لا يُظنّ الدفع حقيقيًا. */
  testMode?: boolean;
  /** هل إرسال البريد مُهيَّأ؟ لا نَعِد بنسخة بريدية بدونه. */
  emailEnabled?: boolean;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<{ code: string; percent: number; price: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);
  // null = لم نتحقق بعد (لا يمكن قراءة localStorage قبل التحميل في المتصفح).
  const [attachedStory, setAttachedStory] = useState<string | null>(null);

  useEffect(() => {
    setAttachedStory(loadOrderStory()?.title ?? "");
  }, []);

  const emailNote = emailEnabled
    ? "وتُرسل نسخة على بريدك حتى لو أغلقتِ الصفحة."
    : "";

  const fields = { buyerName, buyerEmail, childName, storyTitle, details };
  const hasWhatsapp = WHATSAPP_NUMBER.trim().length > 0;

  // خدمة الملامح لا تُنفَّذ بلا وصف؛ نجعل الحقل إلزاميًا ونوضّح المطلوب.
  const needsLooks = product.id === "child-likeness";
  const needsScene = product.id === "extra-image";

  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildOrderText(product, fields)
  )}`;

  const field =
    "rounded-2xl border border-line bg-page px-4 py-3 outline-none transition placeholder:text-ink-soft/50 focus:border-blue focus:bg-white";

  const payPrice = discount?.price ?? product.price;

  async function applyDiscount() {
    const code = discountInput.trim();
    if (!code) return;
    setDiscountError("");
    setCheckingCode(true);
    try {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, code }),
      });
      const data = (await res.json()) as { percent?: number; price?: number; error?: string };
      if (!res.ok || data.price === undefined || !data.percent) {
        setDiscount(null);
        setDiscountError(data.error ?? "كود الخصم غير صالح");
      } else {
        setDiscount({ code, percent: data.percent, price: data.price });
      }
    } catch {
      setDiscountError("تعذّر التحقق من الكود. حاولي مرة أخرى.");
    } finally {
      setCheckingCode(false);
    }
  }

  async function startPayment() {
    setError("");
    setBusy(true);
    try {
      // نُرفق القصة بالطلب ليتمّ التسليم على البريد آليًا من الخادم،
      // دون الحاجة لبقاء المشتري في المتصفح بعد الدفع.
      const story = loadOrderStory() ?? undefined;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          ...fields,
          story,
          discountCode: discount?.code ?? "",
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "تعذّر بدء عملية الدفع الآن. حاولي مرة أخرى.");
        setBusy(false);
        return;
      }

      // تحويل إلى صفحة الدفع الآمنة عند ميسر (تبقى الشاشة معطّلة أثناء التحويل).
      window.location.href = data.url;
    } catch {
      setError("تعذّر الاتصال بالخدمة. تحققي من الشبكة وحاولي مرة أخرى.");
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (paymentEnabled) void startPayment();
      }}
    >
      {/* بيانات الطلب */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="buyerName" className="font-bold">اسمك</label>
          <input id="buyerName" type="text" value={buyerName} maxLength={40} required
            autoComplete="name"
            onChange={(e) => setBuyerName(e.target.value)} placeholder="اسم مقدّم الطلب" className={field} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="buyerEmail" className="font-bold">البريد الإلكتروني</label>
          <input id="buyerEmail" type="email" value={buyerEmail} maxLength={120} required
            autoComplete="email" dir="ltr"
            onChange={(e) => setBuyerEmail(e.target.value)} placeholder="name@example.com"
            className={`text-start ${field}`} />
          <p className="text-xs leading-relaxed text-ink-soft">
            {emailEnabled
              ? "نرسل نسخة من الخدمة على هذا البريد، ونستخدمه للتواصل بشأن طلبك."
              : "نستخدمه للتواصل بشأن طلبك عند الحاجة."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="childName" className="font-bold">اسم الطفل</label>
          <input id="childName" type="text" value={childName} maxLength={40} required
            onChange={(e) => setChildName(e.target.value)} placeholder="بطل القصة" className={field} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="storyTitle" className="font-bold">
            عنوان القصة <span className="text-sm font-normal text-ink-soft">(اختياري)</span>
          </label>
          <input id="storyTitle" type="text" value={storyTitle} maxLength={80}
            onChange={(e) => setStoryTitle(e.target.value)} placeholder="إن كانت القصة قد أُنشئت" className={field} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="details" className="font-bold">
            {needsLooks ? "ملامح الطفل" : needsScene ? "المشهد المطلوب" : "تفاصيل إضافية"}{" "}
            {!needsLooks && (
              <span className="text-sm font-normal text-ink-soft">(اختياري)</span>
            )}
          </label>
          <textarea id="details" value={details} maxLength={400} rows={needsLooks ? 3 : 2}
            required={needsLooks}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              needsLooks
                ? "مثال: شعر أسود قصير مموّج، عينان بنيتان، بشرة حنطية، يلبس ثوبًا أبيض…"
                : needsScene
                  ? "أي لحظة من القصة تحبين رسمها؟ اتركيه فارغًا ونختار أجمل مشهد."
                  : "ملاحظات تحبين أن نراعيها…"
            }
            className={`resize-none ${field}`} />
          {needsLooks && (
            <p className="text-xs leading-relaxed text-ink-soft">
              كلما دقّ الوصف، كانت الرسمة أشبه بطفلك.
            </p>
          )}
        </div>
      </div>

      {/* حالة إرفاق القصة — نُخبر المشترية قبل الدفع لا بعده. */}
      {paymentEnabled && attachedStory !== null && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            attachedStory ? "bg-blue-soft text-ink" : "bg-gold-soft text-ink"
          }`}
        >
          {attachedStory ? (
            <>
              <span className="font-bold text-grass">✔</span> القصة مُرفقة بالطلب
              {attachedStory && <> — «{attachedStory}»</>}، وستُسلَّم الخدمة فورًا بعد
              الدفع. {emailNote}
            </>
          ) : (
            <>
              لم نجد قصة محفوظة في هذا المتصفح. لا مشكلة — بعد الدفع سنطلب منك لصق
              نص القصة، ثم تُسلَّم الخدمة فورًا.
            </>
          )}
        </div>
      )}

      {/* الدفع */}
      {paymentEnabled ? (
        <div className="flex flex-col gap-3">
          {testMode && (
            <p className="rounded-2xl bg-gold-soft px-4 py-3 text-center text-sm font-bold text-ink">
              وضع تجريبي — لن يُخصم أي مبلغ حقيقي.
            </p>
          )}

          {/* كود الخصم */}
          <div className="flex flex-col gap-2">
            <label htmlFor="discountCode" className="font-bold">
              كود الخصم <span className="text-sm font-normal text-ink-soft">(اختياري)</span>
            </label>
            <div className="flex gap-2">
              <input id="discountCode" type="text" value={discountInput} maxLength={20} dir="ltr"
                autoComplete="off"
                onChange={(e) => {
                  setDiscountInput(e.target.value);
                  setDiscount(null);
                  setDiscountError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void applyDiscount();
                  }
                }}
                placeholder="أدخلي الكود"
                className={`min-w-0 flex-1 text-start uppercase ${field}`} />
              <button type="button" onClick={() => void applyDiscount()}
                disabled={checkingCode || !discountInput.trim() || discount !== null}
                className="shrink-0 rounded-2xl border-2 border-blue px-5 font-bold text-blue-deep transition hover:bg-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                {checkingCode ? "…" : discount ? "مُطبَّق" : "تطبيق"}
              </button>
            </div>
            {discount && (
              <p className="text-sm font-medium text-grass">
                ✔ خصم {discount.percent}٪ — السعر بعد الخصم {discount.price} ر.س بدل {product.price} ر.س
              </p>
            )}
            {discountError && (
              <p role="alert" className="text-sm font-medium text-rose-deep">{discountError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-gradient rounded-full px-6 py-4 text-lg font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "جارٍ تحويلك للدفع…" : `ادفع ${payPrice} ر.س`}
          </button>

          {error && (
            <p role="alert" className="text-center text-sm font-medium text-rose-deep">
              {error}
            </p>
          )}

          <p className="text-center text-xs leading-relaxed text-ink-soft">
            يتم الدفع في صفحة آمنة عبر بوابة «ميسر». لا تمرّ بيانات بطاقتك على غِراس.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 rounded-full bg-gold-soft px-6 py-4 text-center font-bold text-ink">
            <span>الدفع الإلكتروني — قريبًا</span>
          </div>
          <p className="text-center text-sm leading-relaxed text-ink-soft">
            نعمل على تفعيل الدفع الإلكتروني الآمن (مدى، وآبل باي، وبطاقات الائتمان).
            {hasWhatsapp && " ولطلب الخدمة الآن يمكن التواصل عبر واتساب."}
          </p>

          {hasWhatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-grass px-5 py-3 text-center font-bold text-white transition hover:brightness-110">
              الطلب عبر واتساب
            </a>
          )}
        </div>
      )}
    </form>
  );
}
