"use client";

import { useState } from "react";
import {
  buildOrderText,
  isValidEmail,
  PAYMENT_ENABLED,
  WHATSAPP_NUMBER,
  type Product,
} from "@/lib/services";

export default function CheckoutForm({ product }: { product: Product }) {
  const [buyerName, setBuyerName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [childName, setChildName] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [details, setDetails] = useState("");

  const fields = { buyerName, email: email.trim(), childName, storyTitle, details };
  const emailOk = isValidEmail(email);
  const showEmailError = emailTouched && !emailOk;
  const hasWhatsapp = WHATSAPP_NUMBER.trim().length > 0;

  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildOrderText(product, fields)
  )}`;

  const field =
    "rounded-2xl border border-line bg-page px-4 py-3 outline-none transition placeholder:text-ink-soft/50 focus:border-blue focus:bg-white";

  return (
    <div className="flex flex-col gap-5">
      {/* بيانات الطلب */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="buyerName" className="font-bold">اسمك</label>
          <input id="buyerName" type="text" value={buyerName} maxLength={40}
            onChange={(e) => setBuyerName(e.target.value)} placeholder="اسم مقدّم الطلب" className={field} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-bold">البريد الإلكتروني</label>
          <input id="email" type="email" dir="ltr" inputMode="email" autoComplete="email" required
            value={email} maxLength={120}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={showEmailError} aria-describedby="email-hint"
            placeholder="name@example.com"
            className={`text-right ${field} ${showEmailError ? "border-rose-deep" : ""}`} />
          <p id="email-hint" className={`text-sm ${showEmailError ? "text-rose-deep" : "text-ink-soft"}`}>
            {showEmailError ? "أدخل بريدًا إلكترونيًا صحيحًا" : "سنرسل إليك الطلب على هذا البريد"}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="childName" className="font-bold">اسم الطفل</label>
          <input id="childName" type="text" value={childName} maxLength={40}
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
            تفاصيل إضافية <span className="text-sm font-normal text-ink-soft">(اختياري)</span>
          </label>
          <textarea id="details" value={details} maxLength={400} rows={2}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="مثال: ملامح الطفل، المشهد المطلوب، ملاحظات…"
            className={`resize-none ${field}`} />
        </div>
      </div>

      {/* الدفع */}
      {PAYMENT_ENABLED ? (
        <button
          type="button"
          disabled={!emailOk}
          onClick={() => setEmailTouched(true)}
          className="btn-gradient rounded-full px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          ادفع {product.price} ر.س
        </button>
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
            <a href={emailOk ? whatsapp : undefined} target="_blank" rel="noopener noreferrer"
              aria-disabled={!emailOk}
              onClick={(e) => { if (!emailOk) { e.preventDefault(); setEmailTouched(true); } }}
              className={`rounded-full bg-grass px-5 py-3 text-center font-bold text-white transition ${
                emailOk ? "hover:brightness-110" : "cursor-not-allowed opacity-50"
              }`}>
              الطلب عبر واتساب
            </a>
          )}
        </div>
      )}
    </div>
  );
}
