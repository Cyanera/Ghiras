import { NextResponse } from "next/server";
import { generateStory } from "@/lib/generate";
import { storyRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = storyRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "تأكدي من تعبئة الحقول المطلوبة";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const story = await generateStory(parsed.data);
    return NextResponse.json(story);
  } catch (err) {
    if (err instanceof Error && err.message === "MISSING_API_KEY") {
      return NextResponse.json(
        { error: "الخدمة غير مهيأة بعد. تأكد من ضبط مفتاح OpenAI في الخادم." },
        { status: 500 }
      );
    }
    console.error("story generation failed:", err);
    // تشخيص مؤقت: نُظهر سبب الخطأ الفعلي لتحديد المشكلة بدقة
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return NextResponse.json(
      { error: `تعذّر توليد القصة الآن. (${detail})` },
      { status: 502 }
    );
  }
}
