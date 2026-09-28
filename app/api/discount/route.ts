import { NextResponse } from "next/server";
import { getProduct } from "@/lib/services";
import { discountPercent, finalPrice } from "@/lib/discounts";

/** يتحقق من كود الخصم ويعيد السعر بعده، دون كشف قائمة الأكواد للمتصفح. */
export async function POST(request: Request) {
  let body: { productId?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const product = getProduct(typeof body.productId === "string" ? body.productId : undefined);
  if (!product) {
    return NextResponse.json({ error: "الخدمة المطلوبة غير موجودة" }, { status: 404 });
  }

  const code = typeof body.code === "string" ? body.code.slice(0, 20) : "";
  const percent = discountPercent(code);
  if (!percent) {
    return NextResponse.json({ error: "كود الخصم غير صالح" }, { status: 400 });
  }

  return NextResponse.json({ percent, price: finalPrice(product.price, code) });
}
