// تنفيذ الخدمات المدفوعة: تحويل القصة إلى الصور الموعودة في كل خدمة.
// كود خادم فقط — يستهلك رصيد OpenAI، ولا يُستدعى إلّا بعد التحقق من الدفع.

import { createTextCompletion, generateImage, getClient } from "@/lib/generate";
import type { Product } from "@/lib/services";

/** أقصى عدد صور للقصة المصوّرة الكاملة — سقف للتكلفة وزمن التنفيذ. */
const MAX_SCENES = 5;

export type StoryInput = {
  title: string;
  story: string;
  key_scene?: string;
  image_prompt?: string;
};

export type DeliveredImage = {
  /** وصف عربي قصير يُعرض تحت الصورة وفي اسم الملف. */
  caption: string;
  /** صورة بصيغة data:image/png;base64,… */
  image: string;
};

export type FulfillmentResult = {
  images: DeliveredImage[];
  /** عدد الصور التي فشل توليدها (نُسلّم الناجح ولا نُسقط الطلب كلّه). */
  failed: number;
};

type ScenePlan = { caption: string; image_prompt: string };

/**
 * يطلب من النموذج النصّي خطة مشاهد للرسم.
 * `character_sheet` وصفٌ ثابت لهيئة الطفل يُدرج في كل مشهد، حتى يبدو الطفل
 * نفسه في كل الصور بدل أن يتغيّر شكله بين صورة وأخرى.
 */
async function planScenes(args: {
  story: StoryInput;
  count: number;
  instruction: string;
  childLooks?: string;
}): Promise<{ characterSheet: string; scenes: ScenePlan[] }> {
  const client = getClient();

  const system = `أنت مدير فني في دار نشر لكتب الأطفال المصوّرة، تُحوّل القصص إلى مشاهد قابلة للرسم.

${args.instruction}

قواعد ثابتة:
- البيئة عربية مسلمة دافئة، والملابس محتشمة، والأم بحجاب أنيق حيث تظهر.
- لا نصوص ولا حروف ولا أرقام داخل الصور إطلاقًا.
- كل مشهد لحظة واحدة واضحة، لا تجميع لعدة أحداث.
- أوصاف الرسم بالإنجليزية، والعناوين التوضيحية بالعربية.

أعد JSON فقط بهذا الشكل بالضبط:
{
  "character_sheet": "A precise English description of the main child's fixed appearance: age, face, hair, eye color, skin tone, and exact clothing with colors — to be reused identically in every scene",
  "scenes": [
    {
      "caption": "عنوان عربي قصير للمشهد (٣–٦ كلمات)",
      "image_prompt": "A detailed English description of this single moment: the child's expression and pose, other characters, the setting with 3-4 specific background details, the light, and the mood"
    }
  ]
}`;

  const user = [
    `عنوان القصة: ${args.story.title}`,
    "",
    "نص القصة:",
    args.story.story,
    args.story.key_scene ? `\nأهم مشهد (رُسم سابقًا): ${args.story.key_scene}` : "",
    args.childLooks ? `\nملامح الطفل كما وصفها أهله: ${args.childLooks}` : "",
    "",
    `المطلوب: ${args.count} ${args.count === 1 ? "مشهد" : "مشاهد"} بالضبط.`,
  ].join("\n");

  const completion = await createTextCompletion(client, [
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("EMPTY_SCENE_PLAN");

  const parsed = JSON.parse(raw) as {
    character_sheet?: unknown;
    scenes?: unknown;
  };

  const characterSheet =
    typeof parsed.character_sheet === "string" ? parsed.character_sheet.trim() : "";

  const scenes = (Array.isArray(parsed.scenes) ? parsed.scenes : [])
    .map((s): ScenePlan | null => {
      const o = s as Record<string, unknown>;
      const caption = typeof o.caption === "string" ? o.caption.trim() : "";
      const prompt = typeof o.image_prompt === "string" ? o.image_prompt.trim() : "";
      return prompt ? { caption: caption || "مشهد من القصة", image_prompt: prompt } : null;
    })
    .filter((s): s is ScenePlan => s !== null)
    .slice(0, args.count);

  if (scenes.length === 0) throw new Error("EMPTY_SCENE_PLAN");

  return { characterSheet, scenes };
}

/** يرسم المشاهد على التوازي؛ فشل مشهد لا يُسقط الباقي. */
async function renderScenes(
  scenes: ScenePlan[],
  characterSheet: string
): Promise<FulfillmentResult> {
  const results = await Promise.allSettled(
    scenes.map((scene) =>
      generateImage(
        characterSheet
          ? `${scene.image_prompt}\n\nMain character (keep identical in every image): ${characterSheet}`
          : scene.image_prompt
      )
    )
  );

  const images: DeliveredImage[] = [];
  let failed = 0;

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      images.push({ caption: scenes[i].caption, image: result.value });
    } else {
      failed++;
      console.error(
        `[fulfillment] تعذّر رسم المشهد ${i + 1}:`,
        result.reason instanceof Error ? result.reason.message : result.reason
      );
    }
  });

  return { images, failed };
}

/** تنفيذ الخدمة المطلوبة وإرجاع الصور الجاهزة للتسليم. */
export async function fulfill(args: {
  product: Product;
  story: StoryInput;
  /** المشهد الذي اختاره المشتري (خدمة الصورة الإضافية). */
  scene?: string;
  /** ملامح الطفل (خدمة الصورة الشبيهة). */
  childLooks?: string;
}): Promise<FulfillmentResult> {
  const { product, story } = args;

  switch (product.id) {
    case "extra-image": {
      const chosen = args.scene?.trim();
      const plan = await planScenes({
        story,
        count: 1,
        instruction: chosen
          ? `اختر اللحظة التي وصفها الأهل: «${chosen}»، وارسمها لحظةً واحدة معبّرة.`
          : "اختر لحظة مؤثّرة من القصة **مختلفة** عن أهم مشهد الذي رُسم سابقًا، ولا تُعِد رسم اللحظة نفسها.",
      });
      return renderScenes(plan.scenes, plan.characterSheet);
    }

    case "child-likeness": {
      const plan = await planScenes({
        story,
        count: 1,
        childLooks: args.childLooks,
        instruction:
          "ارسم الطفل بطلًا لصورة واحدة من قصته، بحيث تحاكي هيئته ملامحه التي وصفها أهله " +
          "(لون الشعر وتسريحته، لون العينين، لون البشرة، والملابس) محاكاةً كرتونية محبّبة. " +
          "اجعل ملامحه واضحة في المقدمة، وضع في character_sheet وصف ملامحه الحقيقية بدقة.",
      });
      return renderScenes(plan.scenes, plan.characterSheet);
    }

    case "full-illustrated": {
      const plan = await planScenes({
        story,
        count: MAX_SCENES,
        childLooks: args.childLooks,
        instruction:
          `قسّم القصة إلى ${MAX_SCENES} مشاهد متتابعة تحكي القصة من بدايتها إلى نهايتها ` +
          "كأنها صفحات كتاب مصوّر، بحيث يظهر الطفل نفسه بالهيئة ذاتها في كل صفحة.",
      });
      return renderScenes(plan.scenes, plan.characterSheet);
    }

    default:
      throw new Error("UNKNOWN_PRODUCT");
  }
}
