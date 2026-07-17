import { NextResponse } from "next/server";
import { startFulfillment } from "@/lib/process-order";

export const runtime = "nodejs";

/**
 * تأكيد دفع تجريبي (وضع المحاكاة فقط). يُعلّم الطلب مدفوعًا ويبدأ التوليد.
 * معطّل تمامًا خارج وضع المحاكاة حمايةً.
 */
export async function POST(request: Request) {
  if ((process.env.PAYMENTS_MODE ?? "mock") !== "mock") {
    return NextResponse.json({ error: "غير متاح" }, { status: 403 });
  }

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (!body.orderId) {
    return NextResponse.json({ error: "معرّف الطلب مفقود" }, { status: 400 });
  }

  await startFulfillment(body.orderId);
  return NextResponse.json({ ok: true });
}
