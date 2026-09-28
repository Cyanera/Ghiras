// أكواد الخصم — كود خادم فقط.
// لا تستوردي هذا الملف في أي مكوّن يعمل في المتصفح، كي لا تظهر الأكواد
// في كود الصفحة. المتصفح يتحقق من الكود عبر /api/discount.

/** الكود ← نسبة الخصم المئوية. الأكواد تُقارن بحروف كبيرة دون مسافات. */
const DISCOUNT_CODES: Record<string, number> = {
  LS2124: 90,
};

/** أقل مبلغ تقبله ميسر للعملية الواحدة: 1 ر.س. */
const MIN_CHARGE_SAR = 1;

export function normalizeCode(code: string | undefined | null): string {
  return (code ?? "").trim().toUpperCase();
}

/** نسبة الخصم للكود، أو 0 إن كان فارغًا أو غير صالح. */
export function discountPercent(code: string | undefined | null): number {
  return DISCOUNT_CODES[normalizeCode(code)] ?? 0;
}

export function isValidDiscountCode(code: string | undefined | null): boolean {
  return discountPercent(code) > 0;
}

/**
 * السعر النهائي بالريال بعد الخصم، مقرّبًا لأقرب هللة.
 * يُستخدم عند إنشاء الفاتورة وعند التحقق من الدفع، فيتطابق المبلغان دائمًا.
 */
export function finalPrice(price: number, code: string | undefined | null): number {
  const percent = discountPercent(code);
  if (!percent) return price;
  const discounted = Math.round(price * (100 - percent)) / 100;
  return Math.max(MIN_CHARGE_SAR, discounted);
}
