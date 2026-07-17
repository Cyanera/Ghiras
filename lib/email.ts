/**
 * إرسال البريد للمستخدمة عند جاهزية الخدمة المدفوعة.
 * يستخدم Resend إن ضُبط RESEND_API_KEY، وإلا يسجّل في اللوق (وضع تطوير).
 */

type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

const FROM = process.env.EMAIL_FROM ?? "غِراس <noreply@ghiras.kids>";

export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // وضع التطوير: لا نرسل فعليًا، فقط نسجّل
    console.log(`[email:mock] إلى ${to} — ${subject}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`RESEND_FAILED: ${res.status} ${detail}`);
  }
}

/** قالب بريد بسيط بالعربية (RTL) لتسليم الخدمة. */
export function deliveryEmailHtml(args: {
  storyTitle: string;
  productTitle: string;
  viewUrl: string;
}): string {
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#fffdf8;padding:24px;color:#33414f">
  <div style="max-width:520px;margin:auto;background:#fff;border:1px solid #efe8dc;border-radius:18px;padding:28px;text-align:center">
    <div style="font-size:34px;font-weight:800;color:#33414f">غِراس 🌱</div>
    <p style="color:#7f8a95;margin:4px 0 20px">قصصٌ تُروى، وقيمٌ تُغرس</p>
    <h2 style="margin:0 0 8px">${args.productTitle} جاهزة!</h2>
    <p style="color:#555">قصة «${args.storyTitle}» أصبحت جاهزة لطفلك.</p>
    <a href="${args.viewUrl}" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#5fa9d6,#e795aa);color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:700">عرض القصة المصوّرة</a>
    <p style="color:#9aa4ad;font-size:12px;margin-top:22px">شكرًا لاختيارك غِراس 💛</p>
  </div>
</div>`;
}
