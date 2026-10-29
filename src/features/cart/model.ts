import type { Bouquet, CatalogSnapshot } from '@/features/catalog/types';
import { formatPriceKzt } from '@/features/catalog/format-price';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';

export type CartItem = Readonly<{ id: string; quantity: number }>;
export type CartLine = CartItem & Readonly<{ bouquet: Bouquet | undefined }>;
export type ReceivingMethod = 'delivery' | 'pickup';
export const receivingMethodLabels: Record<ReceivingMethod, string> = {
  delivery: 'Доставка',
  pickup: 'Самовывоз',
};

export const MAX_CART_QUANTITY = 99;
export const MAX_CART_ITEMS = 100;

function validId(id: unknown): id is string {
  return typeof id === 'string' && id.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
}

function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(MAX_CART_QUANTITY, quantity));
}

export function normalizeCartItems(input: unknown): readonly CartItem[] {
  if (!Array.isArray(input)) return [];
  const quantities = new Map<string, number>();
  for (const row of input) {
    if (!row || typeof row !== 'object' || !validId(row.id) || !Number.isSafeInteger(row.quantity) || row.quantity <= 0) continue;
    const previous = quantities.get(row.id);
    if (previous === undefined && quantities.size >= MAX_CART_ITEMS) continue;
    quantities.set(row.id, Math.min(MAX_CART_QUANTITY, (previous ?? 0) + clampQuantity(row.quantity)));
  }
  return Array.from(quantities, ([id, quantity]) => ({ id, quantity }));
}

export function addCartItem(items: readonly CartItem[], id: string): readonly CartItem[] {
  if (!validId(id)) return items;
  const current = items.find(item => item.id === id);
  if (current) return setCartQuantity(items, id, current.quantity + 1);
  if (items.length >= MAX_CART_ITEMS) return items;
  return [...items, { id, quantity: 1 }];
}

export function setCartQuantity(items: readonly CartItem[], id: string, quantity: number): readonly CartItem[] {
  if (!Number.isSafeInteger(quantity)) return items;
  const current = items.find(item => item.id === id);
  const next = clampQuantity(quantity);
  if (!current || current.quantity === next) return items;
  return items.map(item => item.id === id ? { id, quantity: next } : item);
}

export function removeCartItem(items: readonly CartItem[], id: string): readonly CartItem[] {
  return items.some(item => item.id === id) ? items.filter(item => item.id !== id) : items;
}

export function resolveCart(items: readonly CartItem[], snapshot: CatalogSnapshot) {
  const catalog = new Map(snapshot.status === 'ok' ? snapshot.bouquets.map(bouquet => [bouquet.id, bouquet]) : []);
  const lines: readonly CartLine[] = items.map(item => ({ ...item, bouquet: catalog.get(item.id) }));
  const unavailableCount = lines.filter(line => !line.bouquet).length;
  return {
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    totalKzt: lines.reduce((sum, line) => sum + (line.bouquet?.priceKzt ?? 0) * line.quantity, 0),
    unavailableCount,
    canCheckout: snapshot.status === 'ok' && lines.length > 0 && unavailableCount === 0,
  };
}

export function buildCartWhatsAppLink(lines: readonly CartLine[], receivingMethod: ReceivingMethod): string | null {
  if ((receivingMethod !== 'delivery' && receivingMethod !== 'pickup') || !lines.length || lines.some(({ id, quantity, bouquet }) =>
    !validId(id) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY ||
    !bouquet || bouquet.id !== id || !Number.isSafeInteger(bouquet.priceKzt) || bouquet.priceKzt <= 0
  )) return null;

  let totalKzt = 0;
  const descriptions = lines.map(({ id, quantity, bouquet }, index) => {
    // The guard above excludes unavailable products from an order enquiry.
    const product = bouquet!;
    const lineKzt = product.priceKzt * quantity;
    totalKzt += lineKzt;
    return `${index + 1}. ${product.name} — ${quantity} шт., ${formatPriceKzt(lineKzt)} (арт. ${id})`;
  });
  return buildWhatsAppLink(`Здравствуйте! Хочу заказать:\n\n${descriptions.join('\n')}\n\nИтого за букеты: ${formatPriceKzt(totalKzt)}\nСпособ получения: ${receivingMethodLabels[receivingMethod]}`);
}
