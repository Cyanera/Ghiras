import type { Order } from "./orders";
import { getProduct } from "./products";

/**
 * طبقة الدفع: تدعم وضعين عبر PAYMENTS_MODE:
 *  - "mock"    : وضع تطوير بلا مال حقيقي (صفحة تأكيد محلية) — الافتراضي محليًا.
 *  - "moyasar" : بوابة ميسّر الحقيقية (تحتاج MOYASAR_SECRET_KEY).
 */

const MODE = process.env.PAYMENTS_MODE ?? "mock";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.VERCEL_URL_OVERRIDE ??
    "http://localhost:3000"
  );
}

export type PaymentInit = { url: string };

/** ينشئ عملية دفع للطلب ويعيد رابط الدفع الذي يُوجَّه إليه المستخدم. */
export async function createPayment(order: Order): Promise<PaymentInit> {
  const product = getProduct(order.productId);
  if (!product) throw new Error("UNKNOWN_PRODUCT");

  if (MODE === "moyasar") {
    const key = process.env.MOYASAR_SECRET_KEY;
    if (!key) throw new Error("MISSING_MOYASAR_KEY");

    const res = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: product.amount,
        currency: product.currency,
        description: `${product.title} — غِراس`,
        success_url: `${baseUrl()}/order/${order.id}`,
        metadata: { order_id: order.id },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`MOYASAR_INVOICE_FAILED: ${res.status} ${detail}`);
    }
    const invoice = (await res.json()) as { url?: string };
    if (!invoice.url) throw new Error("MOYASAR_NO_URL");
    return { url: invoice.url };
  }

  // وضع المحاكاة: صفحة تأكيد محلية
  return { url: `${baseUrl()}/pay/mock?order=${order.id}` };
}
