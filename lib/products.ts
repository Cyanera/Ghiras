/**
 * الخدمات المدفوعة في غِراس (القصة نفسها تبقى مجانية).
 * المبالغ بالهللة (أصغر وحدة للريال السعودي) لتوافق بوابة ميسّر.
 */

export type ProductId = "illustrated" | "extra_image";

export type Product = {
  id: ProductId;
  title: string;
  description: string;
  amount: number; // بالهللة (1900 = 19.00 ريال)
  currency: "SAR";
};

export const PRODUCTS: Record<ProductId, Product> = {
  illustrated: {
    id: "illustrated",
    title: "قصة مصوّرة كاملة",
    description: "صورة جميلة لكل مشهد من القصة، في كتيّب مصوّر يبقى لطفلك.",
    amount: 1900, // 19 ريال
    currency: "SAR",
  },
  extra_image: {
    id: "extra_image",
    title: "صورة إضافية",
    description: "صورة أخرى بأسلوب مختلف لأجمل مشهد في القصة.",
    amount: 400, // 4 ريال
    currency: "SAR",
  },
};

export function getProduct(id: string): Product | null {
  return (PRODUCTS as Record<string, Product>)[id] ?? null;
}

export function formatSar(halalas: number): string {
  return `${(halalas / 100).toFixed(halalas % 100 === 0 ? 0 : 2)} ريال`;
}
