"use client";

import { useState } from "react";
import {
  buildOrderText,
  PAYMENT_ENABLED,
  WHATSAPP_NUMBER,
  type Product,
} from "@/lib/services";

export default function CheckoutForm({ product }: { product: Product }) {
  const [buyerName, setBuyerName] = useState("");
  const [childName, setChildName] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [details, setDetails] = useState("");

  const fields = { buyerName, childName, storyTitle, details };
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
          className="btn-gradient rounded-full px-6 py-4 text-lg font-bold text-white"
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
            <a href={whatsapp} target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-grass px-5 py-3 text-center font-bold text-white transition hover:brightness-110">
              الطلب عبر واتساب
            </a>
          )}
        </div>
      )}
    </div>
  );
}
