import { NextResponse } from "next/server";
import { z } from "zod";
import { orderStore } from "@/lib/orders";
import { createPayment } from "@/lib/payments";
import { PRODUCTS, type ProductId } from "@/lib/products";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  productId: z.enum(Object.keys(PRODUCTS) as [string, ...string[]]),
  email: z.string().trim().email("البريد غير صحيح"),
  story: z.object({
    title: z.string().min(1),
    paragraphs: z.array(z.string()).min(1),
    key_scene: z.string().min(1),
    image_prompt: z.string().min(1),
  }),
  // صورة الطفل (data URL) لمنتج «صورة بملامح طفلك» فقط — تُحذف بعد التوليد
  photo: z
    .string()
    .startsWith("data:image/")
    .max(8_000_000, "الصورة كبيرة جدًا")
    .optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "تأكدي من صحة البيانات";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const product = PRODUCTS[parsed.data.productId as ProductId];
  if (product.needsPhoto && !parsed.data.photo) {
    return NextResponse.json(
      { error: "يلزم رفع صورة الطفل لهذه الخدمة." },
      { status: 400 }
    );
  }

  try {
    const order = await orderStore.create({
      productId: parsed.data.productId as ProductId,
      email: parsed.data.email,
      story: parsed.data.story,
      photo: product.needsPhoto ? parsed.data.photo : undefined,
    });
    const payment = await createPayment(order);
    return NextResponse.json({ orderId: order.id, url: payment.url });
  } catch (err) {
    console.error("checkout failed:", err);
    return NextResponse.json(
      { error: "تعذّر بدء الدفع الآن. حاولي مرة أخرى." },
      { status: 502 }
    );
  }
}
