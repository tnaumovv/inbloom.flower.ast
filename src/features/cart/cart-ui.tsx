'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Plus, ShoppingBag, ShoppingCart, Trash2, X } from 'lucide-react';
import { NumberField } from '@/components/arc/number-field';
import { RadioGroup } from '@/components/arc/radio-group';
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
  const scrollArea = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const interruptedTransform = useRef<string | null>(null);
  const [receivingMethod, setReceivingMethod] = useState<ReceivingMethod>('delivery');
  const reducedMotion = useReducedMotion();
  const checkout = cart.canCheckout ? buildCartWhatsAppLink(cart.lines, receivingMethod) : null;

  useEffect(() => {
    const panel = dialog.current;
    if (!panel) return;
    if (!cart.isOpen && !panel.open) return;
    const from = panel.open ? interruptedTransform.current ?? getComputedStyle(panel).transform : 'translateY(100%)';
    interruptedTransform.current = null;
    if (cart.isOpen && !panel.open) panel.showModal();
    panel.dataset.state = cart.isOpen ? 'opening' : 'closing';
    if (reducedMotion) {
      if (!cart.isOpen) panel.close();
      return;
    }
    const animation = panel.animate(
      [{ transform: from }, { transform: cart.isOpen ? 'translateY(0)' : 'translateY(100%)' }],
      { duration: cart.isOpen ? 360 : 260, easing: cart.isOpen ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.4,0,.8,.2)', fill: 'both' },
    );
    let cancelled = false;
    animation.finished.then(() => {
      if (!cancelled && !cart.isOpen) panel.close();
    }).catch(() => { /* A direction change or unmount cancels the previous animation. */ });
    return () => {
      cancelled = true;
      interruptedTransform.current = getComputedStyle(panel).transform;
      animation.cancel();
    };
  }, [cart.isOpen, reducedMotion]);

  return <>
    <button ref={trigger} type="button" className={styles.floating} data-testid="cart-trigger" aria-label={`Открыть корзину, товаров: ${cart.totalQuantity}`} aria-haspopup="dialog" aria-controls="shopping-cart" aria-expanded={cart.isOpen} disabled={!cart.ready} onClick={cart.openCart}>
      <ShoppingCart size={24} strokeWidth={1.6} aria-hidden="true" />
      <span className={styles.floatingLabel}>Корзина</span>
      {cart.totalQuantity > 0 && <span className={styles.count} aria-hidden="true">{cart.totalQuantity}</span>}
    </button>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{cart.ready && `В корзине товаров: ${cart.totalQuantity}`}</p>
    <dialog ref={dialog} id="shopping-cart" className={styles.panel} aria-labelledby="cart-title" onTouchStart={event => {
      swipeStart.current = null;
      if (!cart.isOpen || !window.matchMedia('(max-width: 700px)').matches || event.touches.length !== 1) return;
      const target = event.target;
      if (!(target instanceof Element) || target.closest('button,a,input,label,select,textarea')) return;
      // Scroll an existing list back to its top before a second downward swipe dismisses the sheet.
      if (scrollArea.current?.contains(target) && scrollArea.current.scrollTop > 0) return;
      swipeStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }} onTouchCancel={() => { swipeStart.current = null; }} onTouchEnd={event => {
      const start = swipeStart.current;
      swipeStart.current = null;
      const end = event.changedTouches[0];
      if (!start || !end) return;
      const down = end.clientY - start.y;
      if (down > 72 && Math.abs(end.clientX - start.x) < down * .65) cart.closeCart();
    }} onClose={() => { cart.closeCart(); trigger.current?.focus({ preventScroll: true }); }} onCancel={event => { event.preventDefault(); cart.closeCart(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) cart.closeCart();
    }}>
      <div className={styles.grabHandle} aria-hidden="true"><span /></div>
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
        <div ref={scrollArea} className={styles.scrollArea} data-testid="cart-scroll-area">
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
                    <NumberField
                      className={styles.quantity}
                      label="Количество"
                      ariaLabel={`Количество ${name}`}
                      stepperLabel={`количество ${name}`}
                      value={quantity}
                      onValueChange={next => cart.setQuantity(id, next)}
                      min={1}
                      max={99}
                      step={1}
                      size="sm"
                      locale="ru-RU"
                      disabled={!bouquet || !cart.isOpen}
                    />
                    {bouquet && <span className={styles.lineTotal}>{formatPriceKzt(bouquet.priceKzt * quantity)}</span>}
                  </div>
                </div>
              </li>;
            })}
          </ul>
          <div className={styles.receiving}>
            <RadioGroup
              label="Способ получения"
              name="receiving-method"
              value={receivingMethod}
              onValueChange={value => { if (value === 'delivery' || value === 'pickup') setReceivingMethod(value); }}
              options={[
                { value: 'delivery', label: receivingMethodLabels.delivery, description: 'По Астане · стоимость доставки в WhatsApp' },
                { value: 'pickup', label: receivingMethodLabels.pickup, description: siteConfig.address },
              ]}
            />
          </div>
        </div>
        <div className={styles.panelFooter}>
          <div className={styles.total}><span>{cart.unavailableCount ? 'Доступные букеты' : 'Итого за букеты'}</span><strong data-testid="cart-total">{snapshot.status === 'ok' ? formatPriceKzt(cart.totalKzt) : '—'}</strong></div>
          {checkout ? <a className={styles.checkout} href={checkout} target="_blank" rel="noopener noreferrer">Оформить в WhatsApp <ArrowUpRight size={20} aria-hidden="true" /></a> : <button className={styles.checkout} type="button" disabled>Оформить в WhatsApp</button>}
          <button type="button" className={styles.continue} onClick={cart.closeCart}>Продолжить выбор</button>
        </div>
      </>}
    </dialog>
  </>;
}
