'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Minus, Plus, ShoppingBag, ShoppingCart, Store, Truck, Trash2, X } from 'lucide-react';
import { useCart } from './cart-provider';
import { buildCartWhatsAppLink, receivingMethodLabels, type ReceivingMethod } from './model';
import { useCatalog } from '@/features/catalog/live-catalog';
import { formatPriceKzt } from '@/features/catalog/format-price';
import { BouquetImage } from '@/features/catalog/bouquet-image';
import type { Bouquet } from '@/features/catalog/types';
import { siteConfig } from '@/config/site';
import styles from './cart.module.css';

export function AddToCartButton({ bouquet, iconOnly = false, className = '' }: { bouquet: Bouquet; iconOnly?: boolean; className?: string }) {
  const { items, addItem, ready } = useCart();
  const quantity = items.find(item => item.id === bouquet.id)?.quantity ?? 0;
  return <button type="button" className={`${styles.addButton} ${iconOnly ? styles.iconButton : ''} ${className}`} aria-label={`Добавить ${bouquet.name} в корзину`} title="Добавить в корзину" disabled={!ready || quantity >= 99} onClick={() => addItem(bouquet.id)}>
    <ShoppingCart size={20} aria-hidden="true" />
    {iconOnly ? (quantity > 0 && <span className={styles.smallCount}>{quantity}</span>) : <span>{quantity ? `В корзине · ${quantity}` : 'В корзину'}</span>}
    {!iconOnly && quantity > 0 && <Plus size={16} aria-hidden="true" />}
  </button>;
}

export function CartPanel() {
  const cart = useCart();
  const { snapshot, retry } = useCatalog();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [receivingMethod, setReceivingMethod] = useState<ReceivingMethod>('delivery');
  const checkout = cart.canCheckout ? buildCartWhatsAppLink(cart.lines, receivingMethod) : null;

  useEffect(() => {
    const panel = dialog.current;
    if (!panel) return;
    if (cart.isOpen && !panel.open) panel.showModal();
    if (!cart.isOpen && panel.open) panel.close();
  }, [cart.isOpen]);

  return <>
    <button ref={trigger} type="button" className={styles.floating} data-testid="cart-trigger" aria-label={`Открыть корзину, товаров: ${cart.totalQuantity}`} aria-haspopup="dialog" aria-controls="shopping-cart" aria-expanded={cart.isOpen} disabled={!cart.ready} onClick={cart.openCart}>
      <ShoppingCart size={24} strokeWidth={1.6} aria-hidden="true" />
      <span className={styles.floatingLabel}>Корзина</span>
      {cart.totalQuantity > 0 && <span className={styles.count} aria-hidden="true">{cart.totalQuantity}</span>}
    </button>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{cart.ready && `В корзине товаров: ${cart.totalQuantity}`}</p>
    <dialog ref={dialog} id="shopping-cart" className={styles.panel} aria-labelledby="cart-title" onClose={() => { cart.closeCart(); trigger.current?.focus({ preventScroll: true }); }} onCancel={cart.closeCart} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) cart.closeCart();
    }}>
      <div className={styles.panelHeader}>
        <div><h2 id="cart-title" className="display">Корзина</h2><p>{cart.items.length ? 'Ваш выбор для особого момента' : 'Соберите свой цветочный заказ'}</p></div>
        <button autoFocus type="button" className={styles.close} aria-label="Закрыть корзину" onClick={cart.closeCart}><X size={22} aria-hidden="true" /></button>
      </div>
      {cart.items.length === 0 ? <div className={styles.empty}>
        <ShoppingBag size={48} strokeWidth={1} aria-hidden="true" />
        <h3>Ваша корзина пока пуста</h3>
        <p>Добавьте букеты, которые вам понравились.</p>
        <Link className={styles.checkout} href="/catalog" onClick={cart.closeCart}>Выбрать букет <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div> : <>
        <div className={styles.scrollArea}>
          {snapshot.status !== 'ok' ? <div className={styles.notice} role="status"><p>Не удалось обновить цены. Проверьте каталог перед оформлением.</p><button type="button" onClick={retry}>Обновить каталог</button></div> : cart.unavailableCount > 0 && <p className={styles.notice} role="status">Некоторые букеты сняты с витрины. Удалите их, чтобы оформить остальные.</p>}
          <ul className={styles.items}>
            {cart.lines.map(({ id, quantity, bouquet }) => {
              const name = bouquet?.name || 'Недоступный букет';
              return <li key={id} className={styles.item} data-cart-item={id}>
                {bouquet ? <Link className={styles.itemPhoto} href={`/catalog/${bouquet.slug}`} aria-label={`Открыть ${name}`} onClick={cart.closeCart}><BouquetImage bouquet={bouquet} /></Link> : <div className={styles.itemPhoto}><ShoppingBag size={24} aria-hidden="true" /></div>}
                <div className={styles.itemBody}>
                  <div className={styles.itemTop}>
                    <div>{bouquet ? <Link className={styles.itemName} href={`/catalog/${bouquet.slug}`} onClick={cart.closeCart}>{name}</Link> : <p className={styles.itemName}>Букет недоступен</p>}<p className={styles.itemCode}>Артикул: {id}</p></div>
                    <button type="button" className={styles.remove} aria-label={`Удалить ${name} из корзины`} onClick={() => cart.removeItem(id)}><Trash2 size={18} aria-hidden="true" /></button>
                  </div>
                  <p className={styles.unitPrice}>{bouquet ? `${formatPriceKzt(bouquet.priceKzt)} / шт.` : 'Удалите из корзины'}</p>
                  <div className={styles.itemBottom}>
                    <div className={styles.quantity}>
                      <button type="button" aria-label={`Уменьшить количество ${name}`} disabled={quantity <= 1} onClick={() => cart.setQuantity(id, quantity - 1)}><Minus size={16} aria-hidden="true" /></button>
                      <span data-testid="cart-quantity">{quantity}</span>
                      <button type="button" aria-label={`Увеличить количество ${name}`} disabled={!bouquet || quantity >= 99} onClick={() => cart.setQuantity(id, quantity + 1)}><Plus size={16} aria-hidden="true" /></button>
                    </div>
                    {bouquet && <span className={styles.lineTotal}>{formatPriceKzt(bouquet.priceKzt * quantity)}</span>}
                  </div>
                </div>
              </li>;
            })}
          </ul>
        </div>
        <div className={styles.panelFooter}>
          <fieldset className={styles.receiving} aria-describedby="receiving-help">
            <legend>Способ получения</legend>
            <div className={styles.receivingOptions}>
              {(['delivery', 'pickup'] as const).map(method => {
                const Icon = method === 'delivery' ? Truck : Store;
                return <label key={method} className={styles.receivingOption}>
                  <input type="radio" name="receiving-method" value={method} checked={receivingMethod === method} onChange={() => setReceivingMethod(method)} />
                  <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
                  <span>{receivingMethodLabels[method]}</span>
                </label>;
              })}
            </div>
            <p id="receiving-help" className={styles.receivingHelp}>{receivingMethod === 'delivery' ? 'Стоимость доставки уточним в WhatsApp.' : `Самовывоз: ${siteConfig.address}.`}</p>
          </fieldset>
          <div className={styles.total}><span>{cart.unavailableCount ? 'Доступные букеты' : 'Итого за букеты'}</span><strong data-testid="cart-total">{snapshot.status === 'ok' ? formatPriceKzt(cart.totalKzt) : '—'}</strong></div>
          {checkout ? <a className={styles.checkout} href={checkout} target="_blank" rel="noopener noreferrer">Оформить в WhatsApp <ArrowUpRight size={20} aria-hidden="true" /></a> : <button className={styles.checkout} type="button" disabled>Оформить в WhatsApp</button>}
          <button type="button" className={styles.continue} onClick={cart.closeCart}>Продолжить выбор</button>
        </div>
      </>}
    </dialog>
  </>;
}
