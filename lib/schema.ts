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

export const storySchema = z.object({
  title: z.string().min(1),
  story: z.string().min(1),
  moral: z.string().min(1),
  key_scene: z.string().min(1),
  image_prompt: z.string().min(1),
});

export type Story = z.infer<typeof storySchema>;

export const imageRequestSchema = z.object({
  image_prompt: z.string().trim().min(1).max(2000),
});
