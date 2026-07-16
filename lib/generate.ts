import OpenAI from "openai";
import { storySchema, type Story, type StoryRequest } from "./schema";

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("MISSING_API_KEY");
  }
  return new OpenAI();
}

const AGE_GUIDANCE: Record<StoryRequest["ageGroup"], string> = {
  "3-4":
    "العمر 3–4 سنوات: قصة من 100–150 كلمة، جُمل قصيرة إيقاعية، مفردات يومية محسوسة، تكرار لفظي لطيف يحب الصغار ترديده.",
  "5-6":
    "العمر 5–6 سنوات: قصة من 180–280 كلمة، حوار طبيعي قصير، مشاعر واضحة، وموقف واحد يتصاعد ثم يُحل.",
  "7-8":
    "العمر 7–8 سنوات: قصة من 300–450 كلمة، شخصية تواجه خيارًا حقيقيًا، تفاصيل حسية أغنى، ولمسة دعابة أو دهشة.",
};

export async function generateStory(req: StoryRequest): Promise<Story> {
  const client = getClient();

  const systemPrompt = `أنت كاتب قصص أطفال محترف، بأسلوب دور النشر العربية الراقية لأدب الطفل.

قواعد الكتابة:
- افتح القصة بمشهد حي (صوت، حركة، مفاجأة صغيرة) — لا تبدأ أبدًا بعبارات مثل "في يوم من الأيام" أو "كان يا ما كان".
- عربية فصحى سهلة وموسيقية، بتفاصيل حسية: الألوان، الأصوات، الروائح، ملمس الأشياء.
- حوار قصير طبيعي يشبه كلام الأطفال الحقيقيين.
- البطل يواجه موقفًا حقيقيًا فيه خيار، ويصل إلى الحل بنفسه — الكبار يساندون ولا يُلقّنون.
- القيمة تُفهم من الحدث ونتائجه، ولا يُذكر اسمها في نص القصة إطلاقًا، ولا تختم بجملة وعظية مثل "وهكذا تعلم أن...".
- غير مخيفة، غير عنيفة، ونهايتها دافئة تترك ابتسامة.
- العنوان جذاب وغير مباشر: لا تضع اسم القيمة في العنوان.

أعد الإجابة بصيغة JSON فقط بهذه المفاتيح بالضبط:
{
  "title": "عنوان جذاب قصير بالعربية",
  "story": "نص القصة كاملًا بالعربية، بفقرات مفصولة بسطر فارغ",
  "moral": "سطر واحد رقيق بالعربية يلخص ما تغرسه القصة، بصياغة شاعرية غير وعظية",
  "key_scene": "وصف موجز بالعربية لأهم مشهد في القصة",
  "image_prompt": "A richly detailed English illustration brief for the single most emotional moment of the story. Describe: the child's appearance (age, hair, clothing colors), their exact expression and pose, the other characters, the setting with 3-4 specific background details, the light (golden hour, soft morning light...), and the mood. One moment only, no text in the image."
}`;

  const userPrompt = `اكتب قصة أطفال بهذه المواصفات:
- اسم البطل: ${req.heroName}
- ${AGE_GUIDANCE[req.ageGroup]}
- القيمة المراد تعزيزها: ${req.value}
${req.details ? `- تفاصيل إضافية من الأهل: ${req.details}` : ""}`;

  const completion = await client.chat.completions.create({
    model: TEXT_MODEL,
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("EMPTY_COMPLETION");
  }

  return storySchema.parse(JSON.parse(raw));
}

const IMAGE_STYLE =
  "Award-winning children's picture-book illustration. Soft watercolor and gouache textures, " +
  "warm gentle lighting, rich yet calm pastel palette, expressive charming characters with big kind eyes, " +
  "layered storybook composition with a clear focal point and lovely background depth. " +
  "Absolutely no text, no words, no letters, no captions anywhere in the image.";

export async function generateImage(imagePrompt: string): Promise<string> {
  const client = getClient();
  const isDalle = IMAGE_MODEL.startsWith("dall-e");

  const result = await client.images.generate({
    model: IMAGE_MODEL,
    prompt: `${imagePrompt}\n\nStyle: ${IMAGE_STYLE}`,
    size: isDalle ? "1792x1024" : "1536x1024",
    n: 1,
    // نماذج dall-e تحتاج طلب b64 صراحةً، بينما gpt-image-1 يعيده افتراضيًا
    ...(isDalle
      ? { response_format: "b64_json" as const, quality: "hd" as const }
      : { quality: "high" as const }),
  });

  const item = result.data?.[0];
  if (item?.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }
  if (item?.url) {
    return item.url;
  }
  throw new Error("EMPTY_IMAGE");
}
