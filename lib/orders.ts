// نقطة واحدة لمعالجة الطلبات المدفوعة — كود خادم فقط.
// يُستدعى من مسار العودة (callback) ومن الـ webhook، وكلاهما قد يصل لنفس
// العملية، فالمعالجة هنا يجب أن تكون آمنة عند التكرار (idempotent).

import { verifyPayment, orderReference, type MoyasarPayment } from "@/lib/moyasar";

/**
 * تأكيد عملية دفع وتسجيلها.
 *
 * التسليم الآن يدوي: بيانات الطلب كاملة (البريد، اسم الطفل، التفاصيل) محفوظة
 * في metadata العملية وتظهر في لوحة ميسر وفي سجلات الخادم أدناه.
 *
 * TODO(التسليم الآلي): من هنا يُستدعى توليد الصور وإرسال البريد للمشتري.
 */
export function handlePaidPayment(payment: MoyasarPayment): void {
  const verified = verifyPayment(payment);

  if (!verified.ok) {
    console.error(
      `[order] رفض التأكيد ${payment.id}: ${verified.reason} — ${payment.amount} ${payment.currency}`
    );
    return;
  }

  // بريد المشتري يُسجّل لأنّه لازم للتسليم؛ بقية التفاصيل تُقرأ من لوحة ميسر.
  console.log(
    `[order] مدفوع — رقم ${orderReference(payment.id)} | ${verified.product.name} | ` +
      `${verified.product.price} ر.س | ${payment.metadata?.buyer_email ?? "بلا بريد"}`
  );
}
