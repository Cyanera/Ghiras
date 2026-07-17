import OpenAI from "openai";
import {
  storyModelSchema,
  type Citation,
  type Story,
  type StoryRequest,
} from "./schema";
import { buildReferenceBlock, isKnownValue, type ValueReference } from "./references";
import { retrieveReferencesForValue } from "./retrieve";
import { saveLearnedValue } from "./persist";
import { verifyVerse } from "./quran";
import { verifyHadith } from "./hadith";

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-5.1";
// نموذج احتياطي يُستخدم تلقائيًا إن تعذّر الوصول للنموذج الأساسي (مثلًا عدم توفّره
// في حساب OpenAI)، فلا يتعطّل التطبيق.
const FALLBACK_TEXT_MODEL = process.env.OPENAI_FALLBACK_MODEL ?? "gpt-4o";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
// medium = توازن جيد بين السرعة والجودة؛ يمكن رفعها إلى high من متغيرات البيئة
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? "medium";

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("MISSING_API_KEY");
  }
  return new OpenAI();
}

// نماذج gpt-5 و o-series لا تقبل درجة حرارة مخصصة
function modelSupportsTemperature(model: string): boolean {
  return !/^(gpt-5|o\d)/.test(model);
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * ينفّذ طلب إكمال نصّي بصيغة JSON، ويجرّب النموذج الأساسي ثم الاحتياطي إن
 * تعذّر الوصول للأساسي (مثلًا عدم توفّره في الحساب)، فلا يتعطّل التطبيق.
 */
async function createTextCompletion(client: OpenAI, messages: ChatMessage[]) {
  const models = [...new Set([TEXT_MODEL, FALLBACK_TEXT_MODEL])];
  let lastError: unknown;
  for (const model of models) {
    try {
      return await client.chat.completions.create({
        model,
        ...(modelSupportsTemperature(model) ? { temperature: 0.9 } : {}),
        response_format: { type: "json_object" },
        messages,
      });
    } catch (err) {
      lastError = err;
      console.error(
        `text model "${model}" failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  throw lastError ?? new Error("TEXT_COMPLETION_FAILED");
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

ضمّن في القصة آيةً قرآنية قصيرة وحديثًا نبويًا صحيحًا يرتبطان **بالقيمة الأساسية المطلوبة نفسها** ارتباطًا مباشرًا وواضحًا، لا بحدثٍ جانبي أو تفصيل ثانوي في القصة. عند ذكر الحديث قل: «قال رسول الله ﷺ».

استخدم عربية فصحى سهلة وجميلة، وحوارًا طبيعيًا، وصورًا حسية محببة. اجعل النهاية دافئة ومقنعة، من غير خطبة ختامية أو عبارة مباشرة مثل: «وتعلم البطل أن…».

الآيات والأحاديث — قاعدة قطعية (سيتم التحقق آليًا)
- الصلة بالقيمة أولًا: يجب أن يكون معنى الآية والحديث في صميم القيمة الأساسية المطلوبة، ويأتيان في المشهد المحوري الذي تتجلى فيه القيمة، لا معلَّقين على حدث فرعي. قبل أن تختار النص اسأل نفسك: «هل هذا النص يخاطب جوهر القيمة المطلوبة مباشرة؟» فإن كان يخاطب فكرة جانبية فاستبدله.
- إن كانت القيمة سلوكًا محددًا (مثل النوم المبكر، أو ترتيب الغرفة، أو إتقان العمل)، فابحث أولًا عن نص صحيح يخاطب هذا السلوك أو أصله المباشر (كالنظام، أو حفظ الوقت والنعمة، أو الإحسان في العمل، أو طاعة الوالدين إن كان الأمر منهما)، واربطه صراحةً بالقيمة. لا تلجأ إلى نص عام إلا إذا لم تجد ما هو أقرب، وحينها اربط معناه بالقيمة بوضوح.
- سيُتحقَّق آليًا من كل آية مقابل نص المصحف الكامل، ومن كل حديث مقابل نصّي صحيح البخاري وصحيح مسلم. أي نص لا يُطابق المصدر بحروفه سيُرفض وتُعاد كتابة القصة.
- الآية: يجوز أن تختار أي آية قصيرة مناسبة للقيمة، بشرط أن تكون من القرآن الكريم منقولةً بحروفها تمامًا دون أي تغيير أو نقص أو زيادة حرف.
- الحديث: يجب أن يكون من صحيح البخاري أو صحيح مسلم حصرًا، منقولًا متنه بحروفه كما ورد. لا تستشهد بحديث من كتب أخرى ولو كان مشهورًا، ولا تنقل متنًا بالمعنى.
- في رسالة الطلب ستجد قائمة «مراجع مقترحة موثّقة» مضمونة المطابقة؛ إن لم تكن على يقين تام من لفظ نص آخر، فاستعمل نصًّا من هذه القائمة مما يخدم القيمة مباشرة.
- يُمنَع منعًا باتًا: اختلاق آية أو حديث، أو تعديل الألفاظ، أو دمج نصّين، أو نسبة قول إلى النبي ﷺ ليس في الصحيحين، أو حشو نص لا يرتبط بالقيمة الأساسية.
- ضع النص في موضع طبيعي على لسان أم أو أب أو جد أو جدة أو معلم أو معلمة، يليه شرح قصير ومحِب يربط النص بالقيمة المطلوبة، دون تحويل المشهد إلى درس ديني. عند ذكر آية قل: «قال الله تعالى في كتابه».
- انسخ نص الآية التي استشهدت بها حرفيًا في الحقل "quran_ayah"، ونص متن الحديث حرفيًا في الحقل "hadith" (بلا إسناد وبلا «قال رسول الله ﷺ»)، مطابقًا تمامًا لما كتبته داخل القصة.

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
  "quran_ayah": "نص الآية المستشهد بها حرفيًا كما وردت في القصة، أو نص فارغ إن لم تُستخدم آية",
  "hadith": "متن الحديث المستشهد به حرفيًا (بلا إسناد وبلا: قال رسول الله ﷺ)، أو نص فارغ إن لم يُستخدم حديث",
  "image_prompt": "A detailed English description of the single most emotional moment of the story, set in a warm Muslim Arab family environment with modest clothing (mother in a graceful hijab where she appears). Describe: the child's appearance (age, hair, clothing colors), their exact expression and pose, the other characters, the setting with 3-4 specific background details, the light, and the mood. One moment only, no text in the image."
}`;

  // نماذج gpt-5 و o-series لا تقبل درجة حرارة مخصصة
  const supportsTemperature = !/^(gpt-5|o\d)/.test(TEXT_MODEL);

  // قيمة مخصّصة جديدة: نسترجع مراجعها ونتحقق منها لحظيًا، ثم نحفظها دائمًا.
  let dynamic: ValueReference | undefined;
  if (!isKnownValue(req.value)) {
    dynamic = await retrieveReferencesForValue(
      client,
      TEXT_MODEL,
      req.value,
      supportsTemperature
    );
    if (dynamic.verses.length || dynamic.hadiths.length) {
      // حفظ دائم في المكتبة عبر GitHub (لا يعطّل توليد القصة عند الفشل)
      void saveLearnedValue(req.value, dynamic);
    }
  }

  const userPrompt = `اكتب قصة أطفال بهذه المواصفات:
- اسم البطل: ${req.heroName}
- ${AGE_GUIDANCE[req.ageGroup]}
- القيمة المراد تعزيزها: ${req.value}
${req.details ? `- تفاصيل إضافية من الأهل: ${req.details}` : ""}

${buildReferenceBlock(req.value, dynamic)}`;

  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // نولّد القصة، ثم نتحقق آليًا من الآية والحديث. إن فشل التحقق نعيد المحاولة
  // مرة واحدة مع توجيه تصحيحي، فإن استمر الفشل نُسقط الاستشهاد غير الموثّق
  // بدل عرض نص غير محقّق.
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await createTextCompletion(client, messages);

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("EMPTY_COMPLETION");

    const model = storyModelSchema.parse(JSON.parse(raw));

    const ayahMatch = model.quran_ayah.trim()
      ? verifyVerse(model.quran_ayah)
      : null;
    const hadithMatch = model.hadith.trim() ? verifyHadith(model.hadith) : null;

    const ayahFailed = model.quran_ayah.trim() !== "" && !ayahMatch;
    const hadithFailed = model.hadith.trim() !== "" && !hadithMatch;

    // إن فشل التحقق وما زال أمامنا محاولة، نطلب التصحيح
    if ((ayahFailed || hadithFailed) && attempt === 0) {
      const problems: string[] = [];
      if (ayahFailed)
        problems.push(
          `الآية «${model.quran_ayah}» غير مطابقة لنص المصحف حرفيًا. استبدلها بآية أخرى منقولة بدقة تامة من القرآن (يُفضَّل من المراجع المقترحة).`
        );
      if (hadithFailed)
        problems.push(
          `الحديث «${model.hadith}» غير موجود بهذا اللفظ في صحيح البخاري أو مسلم. استبدله بحديث من الصحيحين منقول متنه بحروفه (يُفضَّل من المراجع المقترحة).`
        );
      messages.push({ role: "assistant", content: raw } as never);
      messages.push({
        role: "user",
        content: `يجب تصحيح الاستشهاد ثم إعادة إخراج نفس القصة بصيغة JSON كاملة:\n- ${problems.join(
          "\n- "
        )}\nاحرص أن يتطابق نص "quran_ayah" و"hadith" مع ما تكتبه داخل القصة.`,
      });
      continue;
    }

    // بناء الاستشهادات الموثّقة فقط
    const citations: Citation[] = [];
    if (ayahMatch)
      citations.push({
        kind: "quran",
        text: model.quran_ayah.trim(),
        reference: ayahMatch.reference,
      });
    if (hadithMatch)
      citations.push({
        kind: "hadith",
        text: model.hadith.trim(),
        reference: hadithMatch.reference,
      });

    return {
      title: model.title,
      story: model.story,
      moral: model.moral,
      key_scene: model.key_scene,
      image_prompt: model.image_prompt,
      citations,
    };
  }

  throw new Error("VERIFICATION_FAILED");
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
