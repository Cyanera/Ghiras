// إرسال الخدمة المُسلَّمة إلى بريد المشتري عبر Resend.
// كود خادم فقط. غير مُهيَّأ = يُتخطّى بهدوء دون تعطيل التسليم في الموقع،
// لأنّ التنزيل المباشر من الصفحة هو التسليم الأساسي والبريد نسخةٌ إضافية.

import type { DeliveredImage } from "@/lib/fulfillment";

const API = "https://api.resend.com/emails";

/** حدّ أقصى لحجم المرفقات (Resend يقبل نحو 40MB؛ نبقى بعيدين عن الحد). */
const MAX_ATTACHMENTS_BYTES = 15 * 1024 * 1024;

export function isEmailConfigured(): boolean {
  return (
    (process.env.RESEND_API_KEY?.trim().length ?? 0) > 0 &&
    (process.env.EMAIL_FROM?.trim().length ?? 0) > 0
  );
}

/** يفصل ترويسة data:URL عن محتوى base64. */
function toBase64(dataUrl: string): string | null {
  const comma = dataUrl.indexOf(",");
  return dataUrl.startsWith("data:") && comma > 0 ? dataUrl.slice(comma + 1) : null;
}

/** اسم ملف آمن — نتجنّب المسافات والرموز في العربية داخل أسماء المرفقات. */
function fileName(index: number, total: number): string {
  return total > 1 ? `ghiras-${index + 1}.png` : "ghiras.png";
}

/**
 * إرسال الصور إلى المشتري. يُعيد true عند نجاح الإرسال.
 * لا يرمي استثناءً أبدًا: فشل البريد لا يجوز أن يُفشل طلبًا مدفوعًا.
 */
export async function sendDelivery(args: {
  to: string;
  productName: string;
  reference: string;
  storyTitle: string;
  images: DeliveredImage[];
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const attachments: { filename: string; content: string }[] = [];
  let bytes = 0;

  args.images.forEach((img, i) => {
    const content = toBase64(img.image);
    if (!content) return;
    // base64 يمثّل نحو ٣/٤ حجمه الفعلي.
    const size = Math.ceil((content.length * 3) / 4);
    if (bytes + size > MAX_ATTACHMENTS_BYTES) return;
    bytes += size;
    attachments.push({ filename: fileName(i, args.images.length), content });
  });

  const attachedAll = attachments.length === args.images.length;

  const html = `<div dir="rtl" style="font-family:system-ui,-apple-system,Segoe UI,Tahoma,sans-serif;line-height:1.9;color:#2a2530">
  <h2 style="margin:0 0 12px">🌱 غِراس</h2>
  <p>وصلك طلب «${escapeHtml(args.productName)}».</p>
  <p><strong>القصة:</strong> ${escapeHtml(args.storyTitle)}<br>
     <strong>رقم الطلب:</strong> ${escapeHtml(args.reference)}</p>
  <p>${
    attachments.length > 0
      ? `الصور مرفقة مع هذه الرسالة (${attachments.length}).`
      : "الصور متاحة للتنزيل من صفحة الطلب في الموقع."
  }${
    attachedAll || attachments.length === 0
      ? ""
      : " وبقيّة الصور متاحة للتنزيل من صفحة الطلب."
  }</p>
  <p style="color:#6b6472;font-size:14px">شكرًا لثقتك — قصصٌ تُروى، وقيمٌ تُغرس.</p>
</div>`;

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM!.trim(),
        to: [args.to],
        subject: `غِراس — ${args.productName} (طلب ${args.reference})`,
        html,
        ...(attachments.length > 0 ? { attachments } : {}),
      }),
    });

    if (!res.ok) {
      console.error(`[email] فشل الإرسال (${res.status})`, (await res.text()).slice(0, 300));
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] تعذّر الاتصال بمزوّد البريد:", err instanceof Error ? err.message : err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
