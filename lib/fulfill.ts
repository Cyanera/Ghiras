import { generateImage, generateScenePrompts } from "./generate";
import type { Order, OrderResult } from "./orders";

/**
 * تنفيذ الخدمة المدفوعة بعد تأكيد الدفع: يولّد المخرجات (صور) حسب نوع المنتج.
 */
export async function fulfillOrder(order: Order): Promise<OrderResult> {
  if (order.productId === "extra_image") {
    const image = await generateImage(
      `${order.story.image_prompt}\n\n(An alternative composition and angle of the same scene.)`
    );
    return { images: [image] };
  }

  // القصة المصوّرة الكاملة: صورة لكل مشهد
  const scenes = await generateScenePrompts(
    {
      title: order.story.title,
      paragraphs: order.story.paragraphs,
      image_prompt: order.story.image_prompt,
    },
    3
  );

  const images: string[] = [];
  for (const scene of scenes) {
    images.push(await generateImage(scene));
  }
  return { images };
}
