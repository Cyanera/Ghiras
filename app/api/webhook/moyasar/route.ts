import { NextResponse } from "next/server";
import { startFulfillment } from "@/lib/process-order";

export const runtime = "nodejs";

/**
 * ويب هوك ميسّر: يصل عند نجاح الدفع. نتحقق من الحالة ونستخرج معرّف الطلب من
 * البيانات المرفقة (metadata.order_id)، ثم نبدأ التوليد.
 * (يُفعّل بضبط PAYMENTS_MODE=moyasar وربط الويب هوك في لوحة ميسّر.)
 */
export async function POST(request: Request) {
  let payload: {
    type?: string;
    data?: {
      status?: string;
      metadata?: { order_id?: string };
    };
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  // نتحقق من التوقيع المشترك إن ضُبط (طبقة حماية إضافية)
  const secret = process.env.MOYASAR_WEBHOOK_SECRET;
  if (secret) {
    const token = request.headers.get("x-moyasar-token") ?? "";
    if (token !== secret) {
      return NextResponse.json({ error: "توقيع غير صالح" }, { status: 401 });
    }
  }

  const status = payload.data?.status;
  const orderId = payload.data?.metadata?.order_id;

  if (status === "paid" && orderId) {
    await startFulfillment(orderId);
  }

  // نعيد 200 دائمًا حتى لا يعيد ميسّر الإرسال بلا داعٍ
  return NextResponse.json({ ok: true });
}
