// إنجاز الطلبات المدفوعة — كود خادم فقط.
//
// يُستدعى من مسارين: إشعار ميسر (webhook) وصفحة النتيجة في المتصفح. أيّهما وصل
// أولًا ينفّذ، والآخر يجد الطلب مُسلَّمًا فلا يُكرّر التوليد ولا تكلفته.

import { orderReference, verifyPayment, type MoyasarPayment } from "@/lib/moyasar";
import { fulfill, type DeliveredImage } from "@/lib/fulfillment";
import { sendDelivery } from "@/lib/email";
import {
  claimFulfillment,
  forgetOrder,
  loadOrder,
  releaseFulfillment,
  type StoredOrder,
} from "@/lib/order-store";
import type { StoryInput } from "@/lib/fulfillment";

export type DeliveryOutcome =
  | { status: "delivered"; images: DeliveredImage[]; failed: number; emailed: boolean }
  /** سُلِّم سابقًا (بالإشعار عادةً) — الصور في بريد المشتري. */
  | { status: "already" }
  /** لا توجد قصة محفوظة: على المتصفح أن يزوّدنا بها. */
  | { status: "needStory" }
  | { status: "rejected"; reason: string }
  | { status: "failed"; reason: string };

/**
 * إنجاز الخدمة وإرسالها على البريد.
 *
 * @param storyFromBrowser قصة يرسلها المتصفح حين لا يكون المخزن مُهيَّأً أو
 *   حين ضاع الطلب المحفوظ — لا تُستخدم إن وُجد الطلب المحفوظ.
 */
export async function deliverOrder(
  payment: MoyasarPayment,
  storyFromBrowser?: StoryInput
): Promise<DeliveryOutcome> {
  const verified = verifyPayment(payment);
  if (!verified.ok) {
    console.error(`[order] رفض التسليم ${payment.id}: ${verified.reason}`);
    return { status: "rejected", reason: verified.reason };
  }

  // نُفرد لكل عملية دفع حجزًا خاصًّا بها. رقم الفاتورة هو ما نعرفه في الحالتين،
  // ونرجع لمعرّف الدفع إن غاب.
  const key = payment.invoice_id?.trim() || payment.id;

  const stored = await loadOrder(key);
  const story = pickStory(stored, storyFromBrowser);

  if (!story) {
    return { status: "needStory" };
  }

  if (!(await claimFulfillment(key))) {
    return { status: "already" };
  }

  const metadata = payment.metadata ?? {};
  // ما وصفه المشتري في نموذج الطلب هو ما دفع مقابله.
  const hint = stored?.details?.trim() || metadata.details?.trim() || "";
  const to = stored?.buyerEmail?.trim() || metadata.buyer_email?.trim() || "";
  const reference = orderReference(payment.id);

  try {
    const result = await fulfill({
      product: verified.product,
      story,
      scene: hint,
      childLooks: hint,
    });

    if (result.images.length === 0) {
      await releaseFulfillment(key);
      return { status: "failed", reason: "تعذّر رسم الصور." };
    }

    const emailed = to
      ? await sendDelivery({
          to,
          productName: verified.product.name,
          reference,
          storyTitle: story.title,
          images: result.images,
        })
      : false;

    console.log(
      `[order] سُلِّم — ${reference} | ${verified.product.name} | ` +
        `${result.images.length} صورة | بريد: ${emailed ? "أُرسل" : "لم يُرسل"}`
    );

    // نجح التسليم ووصل البريد: لم تبقَ حاجة للقصة المحفوظة.
    if (emailed) await forgetOrder(key);

    return { status: "delivered", images: result.images, failed: result.failed, emailed };
  } catch (err) {
    await releaseFulfillment(key);

    const message = err instanceof Error ? err.message : String(err);
    console.error(`[order] فشل التسليم ${reference}:`, message);

    return {
      status: "failed",
      reason: message === "MISSING_API_KEY" ? "الخدمة غير مهيأة على الخادم." : "تعذّر الإنجاز.",
    };
  }
}

/** الطلب المحفوظ أولى، فهو ما اشتراه المشتري فعلًا. */
function pickStory(
  stored: StoredOrder | null,
  fromBrowser?: StoryInput
): StoryInput | null {
  if (stored?.story?.story?.trim()) return stored.story;
  if (fromBrowser?.story?.trim()) return fromBrowser;
  return null;
}
