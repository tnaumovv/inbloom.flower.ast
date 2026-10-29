import { describe, expect, it } from 'vitest';
import {
  addCartItem,
  buildCartWhatsAppLink,
  normalizeCartItems,
  removeCartItem,
  resolveCart,
  setCartQuantity,
} from '@/features/cart/model';
import { createCartStore, type CartStorageEnvironment } from '@/features/cart/storage';
import type { Bouquet, CatalogSnapshot } from '@/features/catalog/types';

const pink: Bouquet = { id: 'pink-cloud', slug: 'pink-cloud', name: 'Розовый & нежный', priceKzt: 15700, image: '/images/pink.webp', imageAlt: 'Розовый букет' };
const blue: Bouquet = { id: 'blue-dream', slug: 'blue-dream', name: 'Blue dream', priceKzt: 20200, image: '/images/blue.webp', imageAlt: 'Голубой букет' };
const catalog = (bouquets: readonly Bouquet[], status: CatalogSnapshot['status'] = 'ok'): CatalogSnapshot => ({ bouquets, status, source: 'sheets', revision: 'test' });

function storage(initial: string | null = null) {
  let saved = initial;
  const listeners = new Set<(value: string | null) => void>();
  const environment: CartStorageEnvironment = {
    read: () => saved,
    write: value => { saved = value; },
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
  return { environment, saved: () => saved, changeFromAnotherTab: (value: string | null) => { saved = value; listeners.forEach(listener => listener(value)); } };
}

describe('cart items', () => {
  it('merges repeated IDs, clamps quantities, and discards malformed rows without trusting saved prices', () => {
    expect(normalizeCartItems([
      { id: 'pink-cloud', quantity: 2, priceKzt: 1 }, { id: 'pink-cloud', quantity: 3 },
      { id: 'blue-dream', quantity: 110 }, { id: 'zero', quantity: 0 }, { id: 'negative', quantity: -2 },
      { id: 'pink-cloud', quantity: 0 }, { id: 'pink-cloud', quantity: -1 },
      { id: 'bad id', quantity: 2 }, { id: 'pink-cloud', quantity: 0.5 },
      { id: 'fraction', quantity: 1.1 }, { id: 'string', quantity: '2' },
      { id: 'infinite', quantity: Infinity }, { id: 'unsafe', quantity: Number.MAX_SAFE_INTEGER + 1 },
      { id: '', quantity: 1 }, { id: 'a'.repeat(81), quantity: 1 }, null,
    ])).toEqual([{ id: 'pink-cloud', quantity: 5 }, { id: 'blue-dream', quantity: 99 }]);
    expect(normalizeCartItems({ id: 'pink-cloud', quantity: 2 })).toEqual([]);
  });

  it('limits distinct products while still aggregating a duplicate of an accepted product', () => {
    const input = Array.from({ length: 105 }, (_, index) => ({ id: `bouquet-${index}`, quantity: 1 }));
    const result = normalizeCartItems([...input, { id: 'bouquet-0', quantity: 2 }]);
    expect(result).toHaveLength(100);
    expect(result[0]).toEqual({ id: 'bouquet-0', quantity: 3 });
    expect(result.some(item => item.id === 'bouquet-100')).toBe(false);
    expect(addCartItem(result, 'new-bouquet')).toEqual(result);
  });

  it('adds, changes, and removes by stable ID without changing another bouquet or accepting fractional quantities', () => {
    let items = addCartItem([], 'pink-cloud');
    items = addCartItem(items, 'pink-cloud');
    items = addCartItem(items, 'blue-dream');
    expect(items).toEqual([{ id: 'pink-cloud', quantity: 2 }, { id: 'blue-dream', quantity: 1 }]);
    expect(addCartItem(items, '../invalid')).toEqual(items);
    expect(setCartQuantity(items, 'pink-cloud', 1.5)).toEqual(items);
    expect(setCartQuantity(items, 'missing', 2)).toEqual(items);
    expect(setCartQuantity(items, 'pink-cloud', 200)[0].quantity).toBe(99);
    expect(setCartQuantity(items, 'pink-cloud', 0)[0].quantity).toBe(1);
    expect(removeCartItem(items, 'pink-cloud')).toEqual([{ id: 'blue-dream', quantity: 1 }]);
  });
});

describe('current catalog prices and availability', () => {
  const items = [{ id: pink.id, quantity: 2 }, { id: blue.id, quantity: 1 }];

  it('recomputes quantities and totals from the latest catalog instead of saved item fields', () => {
    expect(resolveCart(items, catalog([pink, blue]))).toMatchObject({ totalQuantity: 3, totalKzt: 51600, unavailableCount: 0, canCheckout: true });
    const updated = resolveCart(items, catalog([{ ...pink, priceKzt: 18000 }, blue]));
    expect(updated.totalKzt).toBe(56200);
    expect(updated.lines[0].bouquet?.priceKzt).toBe(18000);
  });

  it('keeps missing or hidden IDs removable and blocks checkout until they are removed', () => {
    const current = resolveCart(items, catalog([pink]));
    expect(current).toMatchObject({ totalQuantity: 3, totalKzt: 31400, unavailableCount: 1, canCheckout: false });
    expect(current.lines[1]).toEqual({ id: blue.id, quantity: 1, bouquet: undefined });
    expect(resolveCart(removeCartItem(items, blue.id), catalog([pink])).canCheckout).toBe(true);
  });

  it('blocks empty and unavailable catalogs, even if an unavailable snapshot contains stale products', () => {
    expect(resolveCart([], catalog([pink])).canCheckout).toBe(false);
    const unavailable = resolveCart(items, catalog([pink, blue], 'unavailable'));
    expect(unavailable).toMatchObject({ canCheckout: false, totalKzt: 0, unavailableCount: 2 });
    expect(unavailable.lines.every(line => line.bouquet === undefined)).toBe(true);
  });
});

describe('cart storage', () => {
  it('restores selections and notifies all same-tab consumers while persisting IDs and quantities only', () => {
    const backing = storage('[{"id":"pink-cloud","quantity":2,"priceKzt":1}]');
    const store = createCartStore(backing.environment);
    expect(store.getServerSnapshot()).toEqual({ items: [], ready: false });
    let firstUpdates = 0, secondUpdates = 0;
    const unsubscribeFirst = store.subscribe(() => { firstUpdates++; });
    const unsubscribeSecond = store.subscribe(() => { secondUpdates++; });
    expect(store.getSnapshot()).toEqual({ items: [{ id: 'pink-cloud', quantity: 2 }], ready: true });
    firstUpdates = 0; secondUpdates = 0;
    store.addItem('blue-dream');
    expect(firstUpdates).toBe(1);
    expect(secondUpdates).toBe(1);
    expect(JSON.parse(backing.saved()!)).toEqual([{ id: 'pink-cloud', quantity: 2 }, { id: 'blue-dream', quantity: 1 }]);
    unsubscribeFirst(); unsubscribeSecond();
    const reloaded = createCartStore(backing.environment);
    const unsubscribeReloaded = reloaded.subscribe(() => {});
    expect(reloaded.getSnapshot().items).toEqual([{ id: 'pink-cloud', quantity: 2 }, { id: 'blue-dream', quantity: 1 }]);
    unsubscribeReloaded();
  });

  it('syncs other tabs including clearing the cart without writing stale data back', () => {
    const backing = storage();
    const store = createCartStore(backing.environment);
    const unsubscribe = store.subscribe(() => {});
    store.addItem('pink-cloud');
    backing.changeFromAnotherTab('[{"id":"blue-dream","quantity":4}]');
    expect(store.getSnapshot().items).toEqual([{ id: 'blue-dream', quantity: 4 }]);
    store.setQuantity('blue-dream', 2);
    expect(JSON.parse(backing.saved()!)).toEqual([{ id: 'blue-dream', quantity: 2 }]);
    backing.changeFromAnotherTab(null);
    expect(store.getSnapshot().items).toEqual([]);
    unsubscribe();
  });

  it('starts empty on corrupt data and preserves a usable in-memory cart when storage is unavailable', () => {
    const corrupt = createCartStore(storage('{not valid JSON').environment);
    const unsubscribeCorrupt = corrupt.subscribe(() => {});
    expect(corrupt.getSnapshot()).toEqual({ items: [], ready: true });
    unsubscribeCorrupt();
    const blocked = createCartStore({ read: () => { throw new Error('blocked'); }, write: () => { throw new Error('quota'); }, subscribe: () => () => {} });
    const unsubscribeBlocked = blocked.subscribe(() => {});
    expect(() => { blocked.addItem('pink-cloud'); blocked.setQuantity('pink-cloud', 3); }).not.toThrow();
    expect(blocked.getSnapshot().items).toEqual([{ id: 'pink-cloud', quantity: 3 }]);
    blocked.removeItem('pink-cloud');
    expect(blocked.getSnapshot().items).toEqual([]);
    unsubscribeBlocked();
  });
});

describe('WhatsApp cart enquiry', () => {
  it('includes each stable ID, name, quantity, current line price and correct total in one encoded message', () => {
    const { lines } = resolveCart([{ id: pink.id, quantity: 2 }, { id: blue.id, quantity: 1 }], catalog([pink, blue]));
    const link = buildCartWhatsAppLink(lines);
    expect(link).not.toBeNull();
    const url = new URL(link!);
    const message = url.searchParams.get('text')!.replace(/[\u00a0\u202f]/g, ' ');
    expect(url.origin).toBe('https://wa.me');
    expect(message).toContain('Розовый & нежный');
    expect(message).toContain('pink-cloud');
    expect(message).toContain('blue-dream');
    expect(message).toContain('Blue dream');
    expect(message).toMatch(/2 шт\..*15 700 ₸.*31 400 ₸/u);
    expect(message).toMatch(/1 шт\..*20 200 ₸.*20 200 ₸/u);
    expect(message).toMatch(/Итого: 51 600 ₸/u);
    expect(message).toMatch(/наличие.*доставк/iu);
  });

  it('refuses empty, unavailable, invalid quantities and mismatched bouquet IDs', () => {
    expect(buildCartWhatsAppLink([])).toBeNull();
    expect(buildCartWhatsAppLink([{ id: pink.id, quantity: 1, bouquet: undefined }])).toBeNull();
    expect(buildCartWhatsAppLink([{ id: pink.id, quantity: 0, bouquet: pink }])).toBeNull();
    expect(buildCartWhatsAppLink([{ id: pink.id, quantity: 1, bouquet: blue }])).toBeNull();
  });
});
