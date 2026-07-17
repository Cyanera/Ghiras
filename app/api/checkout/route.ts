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

  try {
    const order = await orderStore.create({
      productId: parsed.data.productId as ProductId,
      email: parsed.data.email,
      story: parsed.data.story,
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
