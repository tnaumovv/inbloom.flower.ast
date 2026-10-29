import { addCartItem, normalizeCartItems, removeCartItem, setCartQuantity, type CartItem } from './model';

export const CART_STORAGE_KEY = 'inbloom.cart.v1';

type CartStoreSnapshot = Readonly<{ items: readonly CartItem[]; ready: boolean }>;
const serverSnapshot: CartStoreSnapshot = { items: [], ready: false };

export type CartStorageEnvironment = {
  read: () => string | null;
  write: (value: string) => void;
  subscribe: (listener: (value: string | null) => void) => () => void;
};

const browserStorage: CartStorageEnvironment = {
  read: () => typeof window === 'undefined' ? null : window.localStorage.getItem(CART_STORAGE_KEY),
  write: value => { if (typeof window !== 'undefined') window.localStorage.setItem(CART_STORAGE_KEY, value); },
  subscribe: listener => {
    if (typeof window === 'undefined') return () => {};
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY && event.key !== null) return;
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return;
      } catch { return; }
      listener(event.key === null ? null : event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); };
  },
};

function parseStoredItems(value: string | null): readonly CartItem[] {
  if (!value || value.length > 100_000) return [];
  try { return normalizeCartItems(JSON.parse(value)); } catch { return []; }
}

export function createCartStore(environment: CartStorageEnvironment = browserStorage) {
  let snapshot = serverSnapshot;
  let stopListening: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const update = (items: readonly CartItem[]) => {
    if (snapshot.ready && JSON.stringify(snapshot.items) === JSON.stringify(items)) return;
    snapshot = { items, ready: true };
    listeners.forEach(listener => listener());
  };
  const restore = () => {
    try { update(parseStoredItems(environment.read())); }
    catch { update(snapshot.items); }
  };
  const change = (mutate: (items: readonly CartItem[]) => readonly CartItem[]) => {
    if (!snapshot.ready) restore();
    const items = mutate(snapshot.items);
    if (items === snapshot.items) return;
    try { environment.write(JSON.stringify(items)); } catch { /* Keep the cart usable when storage is blocked or full. */ }
    update(items);
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (listeners.size === 1) {
        stopListening = environment.subscribe(value => update(parseStoredItems(value)));
        restore();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) { stopListening?.(); stopListening = undefined; }
      };
    },
    addItem: (id: string) => change(items => addCartItem(items, id)),
    setQuantity: (id: string, quantity: number) => change(items => setCartQuantity(items, id, quantity)),
    removeItem: (id: string) => change(items => removeCartItem(items, id)),
  };
}
