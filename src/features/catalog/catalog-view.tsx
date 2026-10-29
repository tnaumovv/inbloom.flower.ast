'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Asterisk, SlidersHorizontal, X } from 'lucide-react';
import { useCatalog, CatalogNotice } from './live-catalog';
import type { Bouquet } from './types';
import { BouquetImage } from './bouquet-image';
import { formatPriceKzt } from './format-price';
import { buildBouquetWhatsAppLink } from '@/features/contact/whatsapp';
import { Pill } from '@/features/storefront/shell';
import { AddToCartButton } from '@/features/cart/cart-ui';
import { SearchField } from '@/components/arc/search-field';
import { Input } from '@/components/arc/input';
import { Select } from '@/components/arc/select';
import styles from './catalog.module.css';

export function BouquetCard({ bouquet: p }: { bouquet: Bouquet }) {
  return <article className={`product-card ${styles.card}`} data-bouquet-id={p.id}>
    <div className={styles.photoFrame}>
      <Link className="product-photo" href={`/catalog/${p.slug}`} aria-label={`Подробнее о букете ${p.name}`}>
        <span className="photo-fallback">Фото букета {p.name}</span>
        <BouquetImage bouquet={p} lazy />
      </Link>
      <AddToCartButton bouquet={p} iconOnly className={styles.photoCart} />
    </div>
    <div className={`product-info ${styles.productInfo}`}>
      <Link className="product-name" href={`/catalog/${p.slug}`}>{p.name}</Link>
      <span className="price">{formatPriceKzt(p.priceKzt)}</span>
    </div>
    <div className="card-actions">
      <Pill href={`/catalog/${p.slug}`} variant="outline">Подробнее</Pill>
      <Pill href={buildBouquetWhatsAppLink(p)} external>Заказать</Pill>
    </div>
  </article>;
}

export function ProductGrid({ products, selection = false }: { products: readonly Bouquet[]; selection?: boolean }) {
  return <div className={`product-grid ${selection ? styles.selectionGrid : ''}`}>{products.map(p => <BouquetCard key={p.id} bouquet={p} />)}</div>;
}

export function Featured({ secondary = false }: { secondary?: boolean }) {
  const { snapshot } = useCatalog();
  const list = secondary ? snapshot.bouquets.slice(4, 8) : snapshot.bouquets.slice(0, 4);
  return <>{!secondary && <CatalogNotice />}{snapshot.status === 'ok' && (list.length ? <ProductGrid products={list} selection /> : <p>Подборка обновляется. Напишите флористу, чтобы выбрать букет.</p>)}</>;
}

const budgets = [
  ['', '', 'Любой бюджет'],
  ['', '10000', 'До 10 000 ₸'],
  ['12000', '16000', '12 000–16 000 ₸'],
  ['20000', '', 'От 20 000 ₸'],
] as const;

const sortOptions = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'asc', label: 'Сначала дешевле' },
  { value: 'desc', label: 'Сначала дороже' },
  { value: 'name', label: 'По названию' },
];

function updateBudget(rawValue: string, onChange: (value: string) => void) {
  const value = rawValue.replace(/\s/g, '');
  if (/^\d*$/.test(value)) onChange(value);
}

export function CatalogView() {
  const { snapshot } = useCatalog();
  const [search, setSearch] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [sort, setSort] = useState('default');
  const [category, setCategory] = useState('');
  const [sheetMin, setSheetMin] = useState('');
  const [sheetMax, setSheetMax] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const sheetRangeInvalid = Boolean(sheetMin && sheetMax && Number(sheetMax) < Number(sheetMin));
  const categories = [...new Set(snapshot.bouquets.map(p => p.category).filter((s): s is string => Boolean(s)))];
  const filtered = Boolean(search.trim() || min || max || category);
  const reset = () => { setSearch(''); setMin(''); setMax(''); setCategory(''); };
  let products = snapshot.bouquets.filter(p =>
    p.name.toLocaleLowerCase('ru').includes(search.trim().toLocaleLowerCase('ru')) &&
    (!min || p.priceKzt >= Number(min)) && (!max || p.priceKzt <= Number(max)) &&
    (!category || p.category === category));
  if (sort === 'asc') products = [...products].sort((a, b) => a.priceKzt - b.priceKzt);
  if (sort === 'desc') products = [...products].sort((a, b) => b.priceKzt - a.priceKzt);
  if (sort === 'name') products = [...products].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return <>
    <CatalogNotice />
    <div className={`catalog-toolbar ${styles.toolbar}`}>
      <SearchField
        fieldClassName={styles.search}
        label="Поиск букета"
        placeholder="Какой букет вы ищете?"
        value={search}
        onValueChange={setSearch}
      />
      <Input
        fieldClassName={styles.budget}
        label="Бюджет от, ₸"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="От"
        value={min}
        onChange={event => updateBudget(event.target.value, setMin)}
      />
      <Input
        fieldClassName={styles.budget}
        label="До, ₸"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="До"
        value={max}
        onChange={event => updateBudget(event.target.value, setMax)}
      />
      <Select fieldClassName={styles.sort} label="Сортировка" value={sort} onValueChange={setSort} options={sortOptions} />
      {categories.length > 0 && <Select
        fieldClassName={styles.category}
        label="Категория"
        value={category ? `category:${category}` : 'all'}
        onValueChange={value => setCategory(value === 'all' ? '' : value.slice('category:'.length))}
        options={[{ value: 'all', label: 'Все категории' }, ...categories.map(value => ({ value: `category:${value}`, label: value }))]}
      />}
      <button type="button" className={`pill outline ${styles.filterTrigger}`} onClick={() => { setSheetMin(min); setSheetMax(max); dialog.current?.showModal(); }}>
        Фильтры <SlidersHorizontal aria-hidden="true" size={16} />{(min || max) && <span className={styles.filterDot} aria-label="Задан бюджет" />}
      </button>
    </div>
    <div className={`catalog-meta ${styles.meta}`}>
      <div className="selected-filters">
        <button className={`filter-chip ${!filtered ? styles.activeChip : ''}`} aria-pressed={!filtered} onClick={reset}>Все букеты</button>
        {min && <button className="filter-chip" aria-label="Убрать минимальный бюджет" onClick={() => setMin('')}>От {formatPriceKzt(Number(min))}<X size={14} aria-hidden="true" /></button>}
        {max && <button className="filter-chip" aria-label="Убрать максимальный бюджет" onClick={() => setMax('')}>До {formatPriceKzt(Number(max))}<X size={14} aria-hidden="true" /></button>}
        {filtered && <button className={styles.reset} onClick={reset}>Сбросить <X size={14} aria-hidden="true" /></button>}
      </div>
      <span className="result-message" aria-live="polite">{snapshot.status === 'ok' ? `Найдено: ${products.length}` : 'Каталог недоступен'}</span>
    </div>
    {snapshot.status === 'ok' && <div id="catalog-results">{products.length ? <ProductGrid products={products} /> : <div className="empty-state"><div><Asterisk className="empty-symbol" aria-hidden="true" size={58} /><h2 className="display">Ничего<br />не найдено</h2><p>Попробуйте другое название или измените бюджет.</p><button className="pill" onClick={reset}>Сбросить фильтры</button></div></div>}</div>}
    <dialog ref={dialog} className="filter-panel" aria-label="Фильтры букетов">
      <form onSubmit={e => { e.preventDefault(); if (sheetRangeInvalid) return; setMin(sheetMin); setMax(sheetMax); dialog.current?.close(); }}>
        <div className="filter-panel-top"><h2 className="display">Фильтры</h2><button autoFocus type="button" className="close-button" aria-label="Закрыть фильтры" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button></div>
        <h3>Бюджет, ₸</h3>
        <div className={`filter-range ${styles.sheetRange}`}>
          <Input label="От" inputMode="numeric" pattern="[0-9]*" placeholder="Любая сумма" value={sheetMin} onChange={event => updateBudget(event.target.value, setSheetMin)} />
          <Input label="До" inputMode="numeric" pattern="[0-9]*" placeholder="Любая сумма" value={sheetMax} onChange={event => updateBudget(event.target.value, setSheetMax)} error={sheetRangeInvalid ? 'Сумма «До» должна быть не меньше «От».' : undefined} />
        </div>
        <div className="filter-options">{budgets.map(([a, b, label]) => <button type="button" key={label} aria-pressed={a === sheetMin && b === sheetMax} className={a === sheetMin && b === sheetMax ? 'active' : ''} onClick={() => { setSheetMin(a); setSheetMax(b); }}>{label}</button>)}</div>
        <p className="sheet-help">Состав и наличие выбранного букета уточнит флорист.</p>
        <div className="filter-panel-actions"><button type="submit" className="pill" disabled={sheetRangeInvalid}>Показать букеты</button><button type="button" className="pill outline" onClick={() => { setSheetMin(''); setSheetMax(''); }}>Сбросить</button></div>
      </form>
    </dialog>
  </>;
}
