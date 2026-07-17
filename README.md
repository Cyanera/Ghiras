# غِراس 🌱

**قصصٌ تُروى، وقيمٌ تُغرس**

أداة ويب بسيطة تولّد قصة أطفال عربية مخصصة بأسلوب إسلامي، مع صورة واحدة لأهم مشهد في القصة.

**🌐 الموقع المباشر:** [ghiras.kids](https://ghiras.kids)

## التقنيات

- Next.js (App Router) + TypeScript
- Tailwind CSS
- OpenAI لتوليد النص والصورة
- Zod للتحقق من المدخلات والمخرجات
- خط «ثمانية» محليًا عبر `next/font/local`

بدون تسجيل دخول، وبدون قاعدة بيانات — لا يتم حفظ أي بيانات.

## التشغيل

1. ثبّت الحزم:

   ```bash
   npm install
   ```

2. انسخ ملف البيئة وأضف مفتاح OpenAI:

   ```bash
   cp .env.example .env.local
   # ثم ضع مفتاحك في OPENAI_API_KEY
   ```

3. شغّل الخادم:

   ```bash
   npm run dev
   ```

4. افتح المتصفح على [http://localhost:3000](http://localhost:3000)

## متغيرات البيئة

| المتغير | الوصف |
| --- | --- |
| `OPENAI_API_KEY` | مفتاح OpenAI (مطلوب) |
| `OPENAI_TEXT_MODEL` | نموذج النص (اختياري، الافتراضي `gpt-4o-mini`) |
| `OPENAI_IMAGE_MODEL` | نموذج الصورة (اختياري، الافتراضي `gpt-image-1`) |

> ملاحظة: نموذج `gpt-image-1` قد يتطلب توثيق المؤسسة في حساب OpenAI. إن لم يكن متاحًا لديك، اضبط `OPENAI_IMAGE_MODEL=dall-e-3`.
