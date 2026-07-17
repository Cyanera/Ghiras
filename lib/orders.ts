import { randomUUID } from "crypto";
import type { ProductId } from "./products";

/**
 * سجلّ الطلبات: يربط عملية الدفع بما يجب توليده بعدها (بلا حسابات مستخدمين).
 *
 * حاليًا مخزن في الذاكرة للتطوير المحلي (يعمل مع `next dev` بعملية واحدة).
 * قبل النشر للإنتاج نستبدله بمخزن دائم (Supabase) بتنفيذ نفس الواجهة، دون
 * تغيير بقية الكود.
 */

export type OrderStatus = "pending" | "paid" | "fulfilled" | "failed";

// لقطة مختصرة من القصة تكفي لتوليد الخدمة المدفوعة بعد الدفع.
export type OrderStory = {
  title: string;
  paragraphs: string[];
  key_scene: string;
  image_prompt: string;
};

export type OrderResult = {
  images: string[]; // روابط أو data URLs للصور المولّدة
};

export type Order = {
  id: string;
  productId: ProductId;
  email: string;
  status: OrderStatus;
  story: OrderStory;
  result?: OrderResult;
  error?: string;
  createdAt: number;
};

export type NewOrder = Pick<Order, "productId" | "email" | "story">;

interface OrderStore {
  create(input: NewOrder): Promise<Order>;
  get(id: string): Promise<Order | null>;
  update(id: string, patch: Partial<Order>): Promise<Order | null>;
}

// --- مخزن الذاكرة (تطوير محلي) ---
class MemoryOrderStore implements OrderStore {
  private orders = new Map<string, Order>();

  async create(input: NewOrder): Promise<Order> {
    const order: Order = {
      id: randomUUID(),
      status: "pending",
      createdAt: Date.now(),
      ...input,
    };
    this.orders.set(order.id, order);
    return order;
  }

  async get(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async update(id: string, patch: Partial<Order>): Promise<Order | null> {
    const current = this.orders.get(id);
    if (!current) return null;
    const updated = { ...current, ...patch };
    this.orders.set(id, updated);
    return updated;
  }
}

export const orderStore: OrderStore = new MemoryOrderStore();
