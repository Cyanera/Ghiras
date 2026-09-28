// بيانات الخدمات الرقمية المدفوعة والطلب في غِراس.
// كل ما يحتاج تعديله (وسائل التواصل، بيانات النشاط، الخدمات، الأسعار) موجود هنا.

// —— وسائل التواصل والطلب ——
// ضعي رقم واتساب بصيغة دولية بلا رموز (مثال: 9665XXXXXXXX) لتفعيل زر واتساب.
// اتركيه فارغًا وسيُعرض الطلب عبر البريد فقط.
export const WHATSAPP_NUMBER = "";

// بريد استقبال الطلبات (نفس بريد التواصل في التذييل).
export const ORDER_EMAIL = "cyanera38@gmail.com";

// رقم وثيقة العمل الحر — يُعرض كشارة توثيق. اتركيه فارغًا لإخفاء الشارة.
export const FREELANCE_DOC_NUMBER = "";

// الدفع الإلكتروني يُفعَّل تلقائيًا بمجرد ضبط MOYASAR_SECRET_KEY في متغيّرات
// البيئة (انظري .env.example). وبدونه تُعرض قنوات الطلب البديلة تلقائيًا،
// فلا حاجة لتعديل أي شيء هنا.

// —— بيانات النشاط (تُعرض في الصفحات النظامية) ——
export const BUSINESS_INFO = {
  name: "غِراس",
  // اسم صاحب النشاط كما في وثيقة العمل الحر (اتركيه فارغًا لإخفائه).
  owner: "",
  city: "المملكة العربية السعودية",
  email: ORDER_EMAIL,
  // سنة بدء النشاط، تُستخدم في حقوق النشر.
  since: "2026",
  // آخر تحديث للصفحات النظامية.
  policyUpdated: "٢٧ يوليو ٢٠٢٦",
} as const;

// وصف موحّد لآلية التسليم (كل الخدمات رقمية فورية).
export const DELIVERY_NOTE =
  "منتج رقمي يُسلَّم فورًا في الموقع بعد إتمام الدفع، ويُنزَّل مباشرة على جهازك.";

// إضافة تُعرض فقط إذا كان إرسال البريد مُهيَّأ فعلًا (isEmailConfigured)،
// كي لا نَعِد المشتري بنسخة بريدية لا تُرسل.
export const EMAIL_NOTE = "وتُرسل نسخة على بريدك الإلكتروني.";

export type Product = {
  id: string;
  name: string;
  tagline: string;
  price: number; // بالريال السعودي
  features: string[];
  featured?: boolean;
  accent: "gold" | "blue" | "rose";
};

// —— الخدمات الرقمية المدفوعة ——
export const PRODUCTS: Product[] = [
  {
    id: "extra-image",
    name: "صورة إضافية للقصة",
    tagline: "صورة أخرى لمشهدٍ مختار من القصة.",
    price: 5,
    accent: "gold",
    features: [
      "صورة جديدة عالية الجودة لمشهدٍ من اختيارك",
      "بنفس أسلوب غِراس البصري المتناسق",
      "تسليم رقمي فوري: تنزيل مباشر بعد الدفع",
    ],
  },
  {
    id: "child-likeness",
    name: "صورة تشبه ملامح الطفل",
    tagline: "رسمة كرتونية تحاكي ملامح الطفل ليغدو بطل الصورة حقًّا.",
    price: 9,
    accent: "blue",
    featured: true,
    features: [
      "رسمة تحاكي ملامح الطفل (لون الشعر، العينين، وغيرها)",
      "تجعل الطفل بطل قصته بصورةٍ شخصية",
      "تسليم رقمي فوري: تنزيل مباشر بعد الدفع",
    ],
  },
  {
    id: "full-illustrated",
    name: "قصة مصوّرة كاملة",
    tagline: "تحويل القصة إلى كتابٍ مصوّر: صورة لكل مشهد.",
    price: 25,
    accent: "rose",
    features: [
      "صورة مستقلّة لكل مشهد رئيسي في القصة",
      "تجربة كتاب مصوّر متكامل للطفل",
      "تنسيق مناسب للقراءة على الشاشة والطباعة المنزلية",
      "تسليم رقمي فوري: تنزيل مباشر بعد الدفع",
    ],
  },
];

export function getProduct(id: string | undefined): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

// —— بناء رسالة الطلب لروابط البريد وواتساب ——
export type OrderFields = {
  buyerName?: string;
  buyerEmail?: string;
  childName?: string;
  storyTitle?: string;
  details?: string;
};

export function buildOrderText(product: Product, f: OrderFields = {}): string {
  return [
    `السلام عليكم، أرغب في خدمة «${product.name}» من غِراس (${product.price} ر.س).`,
    "",
    `اسم مقدّم الطلب: ${f.buyerName ?? ""}`,
    `البريد الإلكتروني: ${f.buyerEmail ?? ""}`,
    `اسم الطفل: ${f.childName ?? ""}`,
    `عنوان القصة (إن وُجد): ${f.storyTitle ?? ""}`,
    `تفاصيل إضافية: ${f.details ?? ""}`,
  ].join("\n");
}

// ميسر يقبل في metadata أزواج «نص: نص» فقط، ويحدّ طولها. نُرفق بيانات الطلب
// هناك لتظهر مع كل عملية في لوحة ميسر وفي الـ webhook، فتكفي لتسليم الخدمة.
const META_MAX = 240;

export function buildOrderMetadata(
  product: Product,
  f: OrderFields = {}
): Record<string, string> {
  const meta: Record<string, string> = { product_id: product.id };
  const put = (key: string, value: string | undefined) => {
    const v = value?.trim();
    if (v) meta[key] = v.slice(0, META_MAX);
  };

  put("buyer_name", f.buyerName);
  put("buyer_email", f.buyerEmail);
  put("child_name", f.childName);
  put("story_title", f.storyTitle);
  put("details", f.details);

  return meta;
}

export function orderMailto(product: Product, f: OrderFields = {}): string {
  const subject = `طلب خدمة: ${product.name} — غِراس`;
  return `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(buildOrderText(product, f))}`;
}

export function orderWhatsapp(product: Product, f: OrderFields = {}): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildOrderText(product, f)
  )}`;
}
