'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPriceKzt } from '@/features/catalog/format-price';
import type { AdminBouquet } from './model';
import { adminFetch } from './client';
import { BouquetForm } from './bouquet-form';
import { AdminEmpty, AdminErrorMessage, AdminHeader } from './admin-parts';
import styles from './admin.module.css';

export function AdminWorkspace({ email }: { email: string }) {
  const [bouquets, setBouquets] = useState<AdminBouquet[] | null>(null); const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState('loading'); const [editor, setEditor] = useState<AdminBouquet | 'new' | null>(null);
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all'); const [notice, setNotice] = useState('');
  async function load(signal?: AbortSignal) {
    try { const result = await adminFetch<{ bouquets: AdminBouquet[] }>('/api/admin/bouquets', undefined, signal); setBouquets(result.bouquets); }
    catch (failure) { if (!signal?.aborted) setError(failure as Error); } finally { if (!signal?.aborted) setBusy(''); }
  }
  useEffect(() => {
    const controller = new AbortController();
    void adminFetch<{ bouquets: AdminBouquet[] }>('/api/admin/bouquets', undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setBouquets(result.bouquets); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure as Error); })
      .finally(() => { if (!controller.signal.aborted) setBusy(''); });
    return () => controller.abort();
  }, []);
  async function toggle(bouquet: AdminBouquet) {
    setBusy(bouquet.id); setError(null); setNotice('');
    try {
      const { bouquet: saved } = await adminFetch<{ bouquet: AdminBouquet }>('/api/admin/bouquets', { draft: { ...bouquet, visible: !bouquet.visible }, version: bouquet.version });
      setBouquets(current => current?.map(item => item.id === saved.id ? saved : item) || [saved]);
      setNotice(saved.visible ? 'Букет опубликован. Витрина обновится автоматически.' : 'Букет скрыт с сайта. Витрина обновится автоматически.');
    } catch (failure) { setError(failure as Error); } finally { setBusy(''); }
  }
  async function logout() {
    setBusy('logout');
    try { await adminFetch('/api/admin/logout', {}); window.location.reload(); }
    catch (failure) { setError(failure as Error); setBusy(''); }
  }
  const saved = (bouquet: AdminBouquet) => {
    setBouquets(current => [...(current || []).filter(item => item.id !== bouquet.id), bouquet].sort((a, b) => a.order - b.order));
    setEditor(null); setNotice(bouquet.visible ? 'Букет сохранён и опубликован. Витрина обновится автоматически.' : 'Букет сохранён скрытым. Покупатели его не видят.'); setError(null);
  };
  const visible = bouquets?.filter(item => item.name.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')) && (filter === 'all' || (filter === 'visible' ? item.visible : !item.visible)));
  return <div className={styles.root}><AdminHeader email={email} onLogout={editor ? undefined : logout} busy={Boolean(busy)} /><main id="main" className={styles.content}>
    {editor ? <BouquetForm key={editor === 'new' ? 'new' : editor.id} initial={editor === 'new' ? null : editor} onSaved={saved} onClose={() => setEditor(null)} /> : <>
      <div className={styles.intro}><div><p className={styles.eyebrow}>Витрина студии</p><h1>Букеты</h1><p>Свежие идеи для вашей коллекции.</p></div><Button className={styles.primaryButton} onClick={() => { setEditor('new'); setNotice(''); }} disabled={bouquets === null || Boolean(busy)}><Plus size={20} />Добавить букет</Button></div>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      <AdminErrorMessage error={error} retry={() => { setError(null); setBusy('loading'); void load(); }} />
      {bouquets !== null && <><div className={styles.toolbar}><label className={styles.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Найти букет</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти букет" /></label><div className={styles.filters} role="group" aria-label="Показывать букеты"><button aria-label="Все букеты" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Все <span>{bouquets.length}</span></button><button aria-label="Только на сайте" aria-pressed={filter === 'visible'} onClick={() => setFilter('visible')}>На сайте</button><button aria-label="Только скрытые" aria-pressed={filter === 'hidden'} onClick={() => setFilter('hidden')}>Скрытые</button></div></div>
      {visible?.length ? <ul className={styles.bouquetList}>{visible.map(bouquet => <li key={bouquet.id} className={styles.bouquet}><button className={styles.bouquetEdit} aria-label={`Редактировать ${bouquet.name || 'букет без названия'}`} onClick={() => { setEditor(bouquet); setNotice(''); }}><span className={styles.thumb}><img src={bouquet.image || '/images/logo.webp'} alt="" width={88} height={100} /></span><span className={styles.bouquetInfo}><span className={styles.statusLabel}>{bouquet.visible ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}{bouquet.visible ? 'На сайте' : 'Скрыт'}</span><strong>{bouquet.name || 'Букет без названия'}</strong><span className={styles.price}>{formatPriceKzt(bouquet.priceKzt)}</span><span className={styles.editHint}>Редактировать</span></span></button><Button variant="ghost" size="sm" className={styles.visibilityButton} disabled={Boolean(busy)} aria-label={`${bouquet.visible ? 'Скрыть' : 'Показать'} ${bouquet.name}`} onClick={() => void toggle(bouquet)}>{busy === bouquet.id ? 'Сохраняем…' : bouquet.visible ? 'Скрыть' : 'Показать'}</Button></li>)}</ul> : <AdminEmpty filtered={bouquets.length > 0 || Boolean(query) || filter !== 'all'} />}</>}
      {busy === 'loading' && bouquets === null && <p role="status" className={styles.loading}>Открываем каталог…</p>}
    </>}
  </main></div>;
}
