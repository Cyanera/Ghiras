/**
 * الخدمات المدفوعة في غِراس (القصة نفسها تبقى مجانية).
 * المبالغ بالهللة (أصغر وحدة للريال السعودي) لتوافق بوابة ميسّر.
 */

export type ProductId = "illustrated" | "likeness";

export type Product = {
  id: ProductId;
  title: string;
  description: string;
  amount: number; // بالهللة (1900 = 19.00 ريال)
  currency: "SAR";
  needsPhoto?: boolean; // يتطلّب رفع صورة الطفل
};

export const PRODUCTS: Record<ProductId, Product> = {
  illustrated: {
    id: "illustrated",
    title: "قصة مصوّرة كاملة",
    description: "صورة جميلة لكل مشهد من القصة، في كتيّب مصوّر يبقى لطفلك.",
    amount: 1900, // 19 ريال
    currency: "SAR",
  },
  likeness: {
    id: "likeness",
    title: "صورة بملامح طفلك",
    description:
      "رسمة كرتونية لطيفة لأجمل مشهد، تشبه ملامح طفلك الحقيقية. (تُحذف صورته فور الإنشاء)",
    amount: 1900, // 19 ريال
    currency: "SAR",
    needsPhoto: true,
  },
};

export function getProduct(id: string): Product | null {
  return (PRODUCTS as Record<string, Product>)[id] ?? null;
}

export function formatSar(halalas: number): string {
  return `${(halalas / 100).toFixed(halalas % 100 === 0 ? 0 : 2)} ريال`;
}
