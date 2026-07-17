/**
 * الخدمات المدفوعة في غِراس (القصة نفسها تبقى مجانية).
 * المبالغ بالهللة (أصغر وحدة للريال السعودي) لتوافق بوابة ميسّر.
 */

export type ProductId = "extra_image" | "likeness" | "illustrated";

export type Product = {
  id: ProductId;
  title: string;
  description: string;
  amount: number; // بالهللة (1900 = 19.00 ريال)
  currency: "SAR";
  needsPhoto?: boolean; // يتطلّب رفع صورة الطفل
};

export const PRODUCTS: Record<ProductId, Product> = {
  extra_image: {
    id: "extra_image",
    title: "توليد صورة جديدة",
    description: "صورة أخرى بأسلوب وزاوية مختلفة لأجمل مشهد في القصة.",
    amount: 300, // 3 ريال
    currency: "SAR",
  },
  likeness: {
    id: "likeness",
    title: "توليد صورة جديدة بملامح طفلك",
    description:
      "رسمة كرتونية لطيفة تشبه ملامح طفلك الحقيقية. (تُحذف صورته فور الإنشاء)",
    amount: 700, // 7 ريال
    currency: "SAR",
    needsPhoto: true,
  },
  illustrated: {
    id: "illustrated",
    title: "قصة مصوّرة كاملة",
    description: "صورة لكل مشهد من القصة، في كتيّب مصوّر يبقى لطفلك.",
    amount: 1900, // 19 ريال
    currency: "SAR",
  },
};

export function getProduct(id: string): Product | null {
  return (PRODUCTS as Record<string, Product>)[id] ?? null;
}

export function formatSar(halalas: number): string {
  return `${(halalas / 100).toFixed(halalas % 100 === 0 ? 0 : 2)} ريال`;
}
