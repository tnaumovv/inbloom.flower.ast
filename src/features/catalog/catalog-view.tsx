'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Asterisk, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCatalog, CatalogNotice } from './live-catalog';
import type { Bouquet } from './types';
import { BouquetImage } from './bouquet-image';
import { formatPriceKzt } from './format-price';
import { buildBouquetWhatsAppLink } from '@/features/contact/whatsapp';
import { Pill } from '@/features/storefront/shell';
import styles from './catalog.module.css';

export function BouquetCard({ bouquet: p }: { bouquet: Bouquet }) {
  return <article className={`product-card ${styles.card}`} data-bouquet-id={p.id}>
    <Link className="product-photo" href={`/catalog/${p.slug}`} aria-label={`Подробнее о букете ${p.name}`}>
      <span className="photo-fallback">Фото букета {p.name}</span>
      <BouquetImage bouquet={p} lazy />
    </Link>
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

export function ProductGrid({ products }: { products: readonly Bouquet[] }) {
  return <div className="product-grid">{products.map(p => <BouquetCard key={p.id} bouquet={p} />)}</div>;
}

export function Featured({ secondary = false }: { secondary?: boolean }) {
  const { snapshot } = useCatalog();
  const list = secondary ? [...snapshot.bouquets.slice(3, 5), ...snapshot.bouquets.slice(1, 2)] : snapshot.bouquets.slice(0, 3);
  return <>{!secondary && <CatalogNotice />}{snapshot.status === 'ok' && (list.length ? <ProductGrid products={list} /> : <p>Подборка обновляется. Напишите флористу, чтобы выбрать букет.</p>)}</>;
}

const budgets = [
  ['', '', 'Любой бюджет'],
  ['', '10000', 'До 10 000 ₸'],
  ['12000', '16000', '12 000–16 000 ₸'],
  ['20000', '', 'От 20 000 ₸'],
] as const;

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
      <label className={`field search-field ${styles.search}`}>
        <span>Поиск букета</span>
        <span className={styles.searchInput}><Search size={18} aria-hidden="true" /><input type="search" placeholder="Какой букет вы ищете?" value={search} onChange={e => setSearch(e.target.value)} /></span>
      </label>
      <label className="field budget-field"><span>Бюджет от, ₸</span><input type="number" min="0" inputMode="numeric" placeholder="От" value={min} onChange={e => setMin(e.target.value)} /></label>
      <label className="field budget-field"><span>До, ₸</span><input type="number" min="0" inputMode="numeric" placeholder="До" value={max} onChange={e => setMax(e.target.value)} /></label>
      <button className="pill outline filter-trigger" onClick={() => { setSheetMin(min); setSheetMax(max); dialog.current?.showModal(); }}>
        Фильтры <SlidersHorizontal aria-hidden="true" size={16} />{(min || max) && <span className={styles.filterDot} aria-label="Задан бюджет" />}
      </button>
      <label className="field sort-field"><span className="sort-label">Сортировка</span><select aria-label="Сортировка" value={sort} onChange={e => setSort(e.target.value)}><option value="default">По умолчанию</option><option value="asc">Сначала дешевле</option><option value="desc">Сначала дороже</option><option value="name">По названию</option></select></label>
      {categories.length > 0 && <label className="field category-field"><span>Категория</span><select value={category} onChange={e => setCategory(e.target.value)}><option value="">Все категории</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>}
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
      <form onSubmit={e => { e.preventDefault(); setMin(sheetMin); setMax(sheetMax); dialog.current?.close(); }}>
        <div className="filter-panel-top"><h2 className="display">Фильтры</h2><button autoFocus type="button" className="close-button" aria-label="Закрыть фильтры" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button></div>
        <h3>Бюджет, ₸</h3>
        <div className="filter-range"><label className="field"><span>От</span><input type="number" min="0" inputMode="numeric" value={sheetMin} onChange={e => setSheetMin(e.target.value)} /></label><label className="field"><span>До</span><input type="number" min={sheetMin || '0'} inputMode="numeric" value={sheetMax} onChange={e => setSheetMax(e.target.value)} /></label></div>
        <div className="filter-options">{budgets.map(([a, b, label]) => <button type="button" key={label} aria-pressed={a === sheetMin && b === sheetMax} className={a === sheetMin && b === sheetMax ? 'active' : ''} onClick={() => { setSheetMin(a); setSheetMax(b); }}>{label}</button>)}</div>
        <p className="sheet-help">Состав и наличие выбранного букета уточнит флорист.</p>
        <div className="filter-panel-actions"><button type="submit" className="pill">Показать букеты</button><button type="button" className="pill outline" onClick={() => { setSheetMin(''); setSheetMax(''); }}>Сбросить</button></div>
      </form>
    </dialog>
  </>;
}
