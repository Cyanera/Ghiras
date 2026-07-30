import { NextResponse } from "next/server";
import { checkoutRequestSchema, firstErrorMessage } from "@/lib/schema";
import { getProduct, buildOrderMetadata } from "@/lib/services";
import { createInvoice, isPaymentConfigured, toHalalas } from "@/lib/moyasar";
import { saveOrder } from "@/lib/order-store";

export const runtime = "nodejs";

/** أصل الموقع: من متغيّر البيئة إن وُجد، وإلّا من ترويسات الطلب (يدعم Vercel). */
function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json(
      { error: "الدفع الإلكتروني غير مهيَّأ بعد. جربي التواصل معنا لإتمام الطلب." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstErrorMessage(parsed.error, "تحققي من بيانات الطلب") },
      { status: 400 }
    );
  }

  const { productId, story, ...fields } = parsed.data;
  const product = getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "الخدمة المطلوبة غير موجودة" }, { status: 404 });
  }

  try {
    const invoice = await createInvoice({
      // السعر من قائمة الخدمات في الخادم — لا من الطلب.
      amount: toHalalas(product.price),
      description: `غِراس — ${product.name}`,
      callbackUrl: `${siteOrigin(request)}/api/moyasar/callback`,
      metadata: buildOrderMetadata(product, fields),
    });

    // نحفظ الطلب مفتاحه رقم الفاتورة، ليُسلَّم آليًا عند وصول إشعار الدفع
    // حتى لو أغلق المشتري المتصفح. فشل الحفظ لا يمنع الدفع: المتصفح يبقى
    // قادرًا على إتمام التسليم بالقصة المحفوظة عنده.
    if (story) {
      await saveOrder(invoice.id, {
        productId: product.id,
        buyerName: fields.buyerName,
        buyerEmail: fields.buyerEmail,
        childName: fields.childName,
        storyTitle: fields.storyTitle,
        details: fields.details,
        story,
        createdAt: Date.now(),
      });
    }

    return NextResponse.json({ url: invoice.url });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "MISSING_MOYASAR_KEY" || code === "MOYASAR_UNAUTHORIZED") {
      console.error("Moyasar credentials are missing or rejected");
      return NextResponse.json(
        { error: "تعذّر تهيئة الدفع. تم إبلاغ فريق غِراس." },
        { status: 503 }
      );
    }

    console.error("invoice creation failed:", code);
    return NextResponse.json(
      { error: "تعذّر بدء عملية الدفع الآن. حاولي مرة أخرى." },
      { status: 502 }
    );
  }
}
