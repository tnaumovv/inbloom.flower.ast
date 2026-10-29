'use client';

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useCatalog } from '@/features/catalog/live-catalog';
import { resolveCart, type CartItem, type CartLine } from './model';
import { createCartStore } from './storage';

type CartContextValue = {
  items: readonly CartItem[];
  lines: readonly CartLine[];
  totalQuantity: number;
  totalKzt: number;
  unavailableCount: number;
  canCheckout: boolean;
  ready: boolean;
  addItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const cartStore = createCartStore();
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { snapshot: catalog } = useCatalog();
  const { items, ready } = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const resolved = useMemo(() => resolveCart(items, catalog), [items, catalog]);
  const value: CartContextValue = {
    items,
    ...resolved,
    ready,
    canCheckout: ready && resolved.canCheckout,
    addItem: id => {
      if (catalog.status === 'ok' && catalog.bouquets.some(bouquet => bouquet.id === id)) cartStore.addItem(id);
    },
    setQuantity: cartStore.setQuantity,
    removeItem: cartStore.removeItem,
    isOpen,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('CartProvider missing');
  return value;
}
