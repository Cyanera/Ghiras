import { orderStore } from "./orders";
import { fulfillOrder } from "./fulfill";
import { sendEmail, deliveryEmailHtml } from "./email";
import { getProduct } from "./products";

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

/**
 * يُعلّم الطلب مدفوعًا، ثم ينفّذ التوليد في الخلفية ويحدّث الطلب عند الجاهزية،
 * ويرسل بريد التسليم. يُصمَّم ليكون آمنًا للاستدعاء المتكرر (idempotent).
 */
export async function startFulfillment(orderId: string): Promise<void> {
  const order = await orderStore.get(orderId);
  if (!order) return;
  if (order.status === "paid" || order.status === "fulfilled") return; // مُعالَج

  await orderStore.update(orderId, { status: "paid" });

  // التوليد قد يستغرق وقتًا؛ لا نُعطّل الاستجابة عليه.
  void (async () => {
    try {
      const result = await fulfillOrder({ ...order, status: "paid" });
      // نحذف صورة الطفل فور الانتهاء (خصوصية): لا تُخزَّن ولا تظهر في المخرجات
      await orderStore.update(orderId, {
        status: "fulfilled",
        result,
        photo: undefined,
      });
      const product = getProduct(order.productId);
      await sendEmail({
        to: order.email,
        subject: `${product?.title ?? "خدمتك"} من غِراس جاهزة 🌱`,
        html: deliveryEmailHtml({
          storyTitle: order.story.title,
          productTitle: product?.title ?? "الخدمة",
          viewUrl: `${baseUrl()}/order/${orderId}`,
        }),
      }).catch((e) => console.error("email failed:", e));
    } catch (err) {
      console.error("fulfillment failed:", err);
      // نحذف الصورة حتى عند الفشل (لا نحتفظ بها إطلاقًا)
      await orderStore.update(orderId, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        photo: undefined,
      });
    }
  })();
}
