import { z } from "zod";

export const AGE_GROUPS = ["3-4", "5-6", "7-8"] as const;

export const VALUES = [
  "الصدق",
  "التعاون",
  "الشجاعة",
  "الصبر",
  "اللطف",
  "الأمانة",
  "النظافة",
  "تحمل المسؤولية",
  "بر الوالدين",
  "الشكر",
  "حب العلم",
  "الرحمة",
  "التواضع",
  "الكرم",
  "العفو",
  "إتقان العمل",
] as const;

export const storyRequestSchema = z.object({
  heroName: z
    .string({ required_error: "اسم البطل مطلوب" })
    .trim()
    .min(1, "اسم البطل مطلوب")
    .max(40, "الاسم طويل جدًا"),
  ageGroup: z.enum(AGE_GROUPS, { message: "اختاري عمر الطفل" }),
  value: z
    .string({ required_error: "اختاري القيمة أو اكتبيها" })
    .trim()
    .min(1, "اختاري القيمة أو اكتبيها")
    .max(30, "اسم القيمة طويل جدًا"),
  details: z.string().trim().max(400, "التفاصيل طويلة جدًا").optional().default(""),
});

export type StoryRequest = z.infer<typeof storyRequestSchema>;

// مخرجات النموذج الخام (قبل التحقق من الاستشهادات)
export const storyModelSchema = z.object({
  title: z.string().min(1),
  story: z.string().min(1),
  moral: z.string().min(1),
  key_scene: z.string().min(1),
  image_prompt: z.string().min(1),
  // نص الآية المستشهد بها حرفيًا كما وردت في القصة (فارغ إن لم تُستخدم آية)
  quran_ayah: z.string().default(""),
  // نص الحديث المستشهد به حرفيًا كما ورد في القصة (فارغ إن لم يُستخدم حديث)
  hadith: z.string().default(""),
});

export type StoryModel = z.infer<typeof storyModelSchema>;

// مرجع مُحقّق يُعرض في هامش القصة
export type Citation = {
  kind: "quran" | "hadith";
  text: string; // نص الآية أو الحديث
  reference: string; // «سورة البقرة: 153» أو «رواه البخاري (رقم 1)»
};

// القصة النهائية المُعادة للواجهة (بعد التحقق)
export type Story = {
  title: string;
  story: string;
  moral: string;
  key_scene: string;
  image_prompt: string;
  citations: Citation[];
};

export const imageRequestSchema = z.object({
  image_prompt: z.string().trim().min(1).max(2000),
});

// طلب بدء الدفع لخدمة مدفوعة. لا يحتوي المبلغ إطلاقًا: السعر يُقرأ في الخادم
// من قائمة PRODUCTS حتى لا يكون قابلًا للتلاعب من المتصفح.
export const checkoutRequestSchema = z.object({
  productId: z.string().trim().min(1, "الخدمة غير محددة"),
  buyerName: z
    .string({ required_error: "الاسم مطلوب" })
    .trim()
    .min(1, "الاسم مطلوب")
    .max(40, "الاسم طويل جدًا"),
  buyerEmail: z
    .string({ required_error: "البريد الإلكتروني مطلوب" })
    .trim()
    .min(1, "البريد الإلكتروني مطلوب")
    .max(120, "البريد طويل جدًا")
    .email("تحققي من صيغة البريد الإلكتروني"),
  childName: z
    .string({ required_error: "اسم الطفل مطلوب" })
    .trim()
    .min(1, "اسم الطفل مطلوب")
    .max(40, "الاسم طويل جدًا"),
  storyTitle: z.string().trim().max(80, "العنوان طويل جدًا").optional().default(""),
  details: z.string().trim().max(400, "التفاصيل طويلة جدًا").optional().default(""),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
