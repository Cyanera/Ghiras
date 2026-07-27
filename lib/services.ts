// بيانات صفحة الخدمات المدفوعة والطلب في غِراس.
// كل ما يحتاج تعديله (وسائل التواصل، بيانات النشاط، الباقات، الأسعار) موجود هنا.

// —— وسائل التواصل والطلب ——
// ضعي رقم واتساب بصيغة دولية بلا رموز (مثال: 9665XXXXXXXX) لتفعيل زر واتساب.
// اتركيه فارغًا وسيُعرض الطلب عبر البريد فقط.
export const WHATSAPP_NUMBER = "";

// بريد استقبال الطلبات (نفس بريد التواصل في التذييل).
export const ORDER_EMAIL = "cyanera38@gmail.com";

// رقم وثيقة العمل الحر — يُعرض كشارة توثيق. اتركيه فارغًا لإخفاء الشارة.
export const FREELANCE_DOC_NUMBER = "";

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

export type Package = {
  id: string;
  name: string;
  tagline: string;
  price: number; // بالريال السعودي
  unit?: string; // وصف صغير بجانب السعر (مثال: «تبدأ من»)
  delivery: string; // آلية/مدّة التسليم — يظهر في صفحة الطلب
  features: string[];
  featured?: boolean;
  accent: "gold" | "blue" | "rose";
};

// —— الباقات المعروضة ——
export const PACKAGES: Package[] = [
  {
    id: "story-plus",
    name: "قصة مخصّصة مطوّلة",
    tagline: "قصة أطول وأعمق باسم طفلك، بعدة مشاهد مصوّرة.",
    price: 39,
    unit: "للقصة",
    delivery: "تسليم رقمي (PDF) خلال ٢–٣ أيام عمل.",
    accent: "gold",
    features: [
      "قصة موسّعة (٣ إلى ٥ مشاهد) لا مشهدًا واحدًا",
      "صور متناسقة لكل مشهد رئيسي",
      "استشهادات موثّقة من القرآن والسنة",
      "ملف PDF أنيق جاهز للقراءة والطباعة المنزلية",
      "مراجعة وتعديل واحد مجاني",
    ],
  },
  {
    id: "values-book",
    name: "كتاب القيم المصوّر",
    tagline: "كتاب كامل يغرس عدة قيم، بغلاف يحمل اسم طفلك.",
    price: 149,
    unit: "للكتاب",
    delivery: "تسليم رقمي (PDF) خلال ٥–٧ أيام عمل.",
    accent: "blue",
    featured: true,
    features: [
      "كتاب من ٨ إلى ١٢ مشهدًا بأسلوب بصري موحّد",
      "غلاف مخصّص باسم الطفل وصورته الرمزية",
      "حتى ٣ قيم مترابطة في قصة واحدة",
      "تنسيق طباعي احترافي بجودة عالية (PDF)",
      "مراجعتان وتعديلات حتى الرضا",
    ],
  },
  {
    id: "printed-gift",
    name: "حزمة الإهداء المطبوعة",
    tagline: "نسخة مطبوعة بغلاف مقوّى، هدية تبقى في الذاكرة.",
    price: 249,
    unit: "تبدأ من",
    delivery: "تسليم رقمي فوري بعد الاعتماد، وشحن النسخة المطبوعة خلال ٧–١٤ يوم عمل.",
    accent: "rose",
    features: [
      "كل ما في «كتاب القيم المصوّر»",
      "نسخة مطبوعة بغلاف مقوّى وورق فاخر",
      "تغليف هدية أنيق",
      "شحن داخل المملكة",
      "النسخة الرقمية مرفقة كذلك",
    ],
  },
];

export function getPackage(id: string | undefined): Package | undefined {
  return PACKAGES.find((p) => p.id === id);
}

// —— بناء رسالة الطلب لروابط البريد وواتساب ——
export type OrderFields = {
  buyerName?: string;
  childName?: string;
  age?: string;
  value?: string;
  details?: string;
};

export function buildOrderText(pkg: Package, f: OrderFields = {}): string {
  return [
    `السلام عليكم، أرغب في طلب باقة «${pkg.name}» من غِراس (${pkg.price} ر.س).`,
    "",
    `اسم مقدّم الطلب: ${f.buyerName ?? ""}`,
    `اسم الطفل: ${f.childName ?? ""}`,
    `عمر الطفل: ${f.age ?? ""}`,
    `القيمة/الفكرة المطلوبة: ${f.value ?? ""}`,
    `تفاصيل إضافية: ${f.details ?? ""}`,
  ].join("\n");
}

export function orderMailto(pkg: Package, f: OrderFields = {}): string {
  const subject = `طلب باقة: ${pkg.name} — غِراس`;
  return `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(buildOrderText(pkg, f))}`;
}

export function orderWhatsapp(pkg: Package, f: OrderFields = {}): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildOrderText(pkg, f)
  )}`;
}
