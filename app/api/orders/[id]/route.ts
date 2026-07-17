import { NextResponse } from "next/server";
import { orderStore } from "@/lib/orders";
import { getProduct } from "@/lib/products";

export const runtime = "nodejs";

// حالة الطلب ونتيجته (للاستطلاع من الصفحة حتى الجاهزية).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await orderStore.get(id);
  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  const product = getProduct(order.productId);
  return NextResponse.json({
    id: order.id,
    status: order.status,
    product: product ? { id: product.id, title: product.title } : null,
    storyTitle: order.story.title,
    result: order.result ?? null,
    error: order.error ?? null,
  });
}
