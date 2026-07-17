import OpenAI from "openai";
import { storySchema, type Story, type StoryRequest } from "./schema";
import { buildReferenceBlock } from "./references";

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-5.1";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
// medium = توازن جيد بين السرعة والجودة؛ يمكن رفعها إلى high من متغيرات البيئة
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? "medium";

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

  const systemPrompt = `أنت كاتب محترف في أدب الطفل، ومربٍّ يفهم نفسية الطفل ومراحل نموه، ومتخصص في غرس القيم بروح إسلامية دافئة ومتوازنة.

اكتب قصة تبدو كأنها صادرة عن دار نشر متميزة في أدب الطفل المسلم: ممتعة أولًا، مؤثرة تربويًا دون تلقين، وجميلة لغويًا دون تعقيد.

اجعل القصة مناسبة تمامًا لعمر الطفل من حيث طولها، ومفرداتها، وحواراتها، وعمق أحداثها ومشاعر شخصياتها. اغرس القيمة من خلال أحداث ممتعة واختيارات ومواقف يعيشها البطل، لا من خلال الوعظ المباشر أو شرح العبرة.

امنح نفسك حرية ابتكار المكان والشخصيات والمشكلة وأسلوب السرد والنهاية بما يناسب كل قصة. نوّع في الأفكار والبناء، ولا تتبع قالبًا ثابتًا أو تكرر النمط نفسه بين القصص.

اجعل التربية في القصة مستلهمة من الهدي النبوي في الرحمة والرفق والحوار والقدوة واحترام مشاعر الطفل، دون تخويف أو إهانة أو إشعاره بأنه طفل سيئ عند الخطأ.

ضمّن في القصة آية قرآنية قصيرة وحديثًا نبويًا صحيحًا يرتبطان بالقيمة بصورة طبيعية وغير متكلفة. عند ذكر الحديث قل: «قال رسول الله ﷺ».

استخدم عربية فصحى سهلة وجميلة، وحوارًا طبيعيًا، وصورًا حسية محببة. اجعل النهاية دافئة ومقنعة، من غير خطبة ختامية أو عبارة مباشرة مثل: «وتعلم البطل أن…».

الآيات والأحاديث — قاعدة قطعية
- ستُزوَّد في رسالة الطلب بقائمة «المراجع الموثّقة» من الآيات والأحاديث الصحيحة لهذه القيمة.
- لا يجوز لك الاستشهاد بأي آية أو حديث إطلاقًا إلا نصًّا واحدًا أو نصّين مأخوذين حرفيًا من تلك القائمة، بحروفهما كما وردت تمامًا.
- يُمنَع منعًا باتًا: اختلاق آية أو حديث، أو الاستشهاد بنص من ذاكرتك غير موجود في القائمة، أو تعديل ألفاظ النص، أو دمج نصّين، أو نسبة قول إلى النبي ﷺ ليس في القائمة.
- ضع النص في موضع طبيعي على لسان أم أو أب أو جد أو جدة أو معلم أو معلمة، يليه شرح قصير ومحِب يناسب الطفل دون تحويل المشهد إلى درس ديني.
- إن لم يناسب أيٌّ من نصوص القائمة سياق القصة، فاذكر معنى القيمة بأسلوبك دون وضع أي نص بين علامتي تنصيص ودون نسبته إلى القرآن أو النبي ﷺ. جودة القصة وصدق النسبة أهم من حشو نص غير مناسب.
- عند ذكر آية قل: «قال الله تعالى في كتابه».

القدوات الإسلامية
يمكن إدخال إشارة قصيرة جدًا إلى نبي أو صحابي أو صحابية أو شخصية إسلامية موثوقة تتجلى فيها القيمة، بشرط أن:
- تكون المعلومة صحيحة ومشهورة.
- تناسب عمر الطفل.
- تُروى بمحبة في جملة أو جملتين فقط.
- تخدم الحدث ولا توقف سير القصة.
- لا تتحول إلى درس تاريخي.
- لا تجعل البطل يقارن نفسه بالقدوة مقارنة تُشعره بالنقص.
إذا لم توجد قدوة مناسبة ومؤكدة، فلا تضف واحدة. جودة القصة أهم من حشد الإشارات الدينية.

تفاصيل الأهل
- استخدم التفاصيل الإضافية التي يقدمها الأهل عندما تخدم القصة.
- لا تكرر التفاصيل حرفيًا إذا كانت صياغتها لا تناسب أدب الطفل.
- لا تضف معلومات حساسة أو محرجة إلى القصة.
- إذا تضمنت التفاصيل رغبة في لوم الطفل أو تخويفه أو فضحه، حوّلها إلى معالجة تربوية آمنة دون إهانة.
- لا تجعل القصة تبدو وكأنها عقوبة موجهة إلى طفل بعينه.
- اجعل اسم البطل يظهر بصورة طبيعية، ولا تكرره في كل فقرة.

ضع عنوانًا جذابًا وغير مباشر.

صيغة الإخراج
أعد الإجابة بصيغة JSON فقط بهذه المفاتيح بالضبط:
{
  "title": "العنوان وفق قواعد العنوان أعلاه",
  "story": "نص القصة كاملًا بالعربية، في فقرات قصيرة ومريحة للقراءة مفصولة بسطر فارغ",
  "moral": "سطر واحد رقيق يربط القيمة بأصلها الإسلامي والأخلاقي بلطف، غير وعظي",
  "key_scene": "وصف موجز بالعربية لأهم مشهد في القصة",
  "image_prompt": "A detailed English description of the single most emotional moment of the story, set in a warm Muslim Arab family environment with modest clothing (mother in a graceful hijab where she appears). Describe: the child's appearance (age, hair, clothing colors), their exact expression and pose, the other characters, the setting with 3-4 specific background details, the light, and the mood. One moment only, no text in the image."
}`;

  const userPrompt = `اكتب قصة أطفال بهذه المواصفات:
- اسم البطل: ${req.heroName}
- ${AGE_GUIDANCE[req.ageGroup]}
- القيمة المراد تعزيزها: ${req.value}
${req.details ? `- تفاصيل إضافية من الأهل: ${req.details}` : ""}

${buildReferenceBlock(req.value)}`;

  // نماذج gpt-5 و o-series لا تقبل درجة حرارة مخصصة
  const supportsTemperature = !/^(gpt-5|o\d)/.test(TEXT_MODEL);

  const completion = await client.chat.completions.create({
    model: TEXT_MODEL,
    ...(supportsTemperature ? { temperature: 0.9 } : {}),
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
  "A delightful digital cartoon illustration for a children's picture book. Use a clean, polished " +
  "digital art style with soft shading, warm gentle lighting, and a rich yet calm pastel color palette. " +
  "Feature adorable stylized characters with big kind eyes, rounded shapes, expressive faces, and " +
  "charming playful poses. Emphasize a clear cartoon look with smooth finishes, readable forms, and a " +
  "whimsical, child-friendly feel. Create a layered storybook composition with a strong focal point and " +
  "lovely background depth. Absolutely no text, no words, no letters, no captions anywhere in the image.";

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
      ? { response_format: "b64_json" as const }
      : { quality: IMAGE_QUALITY as "low" | "medium" | "high" }),
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
