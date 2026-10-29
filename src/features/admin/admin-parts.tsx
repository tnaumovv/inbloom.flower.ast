'use client';
import { ArrowUpRight, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminError } from './errors';
import styles from './admin.module.css';

export function AdminHeader({ email, onLogout, busy }: { email?: string; onLogout?: () => void; busy?: boolean }) {
  return <header className={styles.header}><a href="/admin" className={styles.brand} aria-label="In Bloom — управление каталогом"><img src="/images/logo.webp" width={52} height={52} alt="In Bloom" /><span>IN BLOOM<small>Управление каталогом</small></span></a><div className={styles.headerActions}><a href="/" target="_blank" rel="noopener noreferrer" className={styles.siteLink}>На сайт <ArrowUpRight size={16} /></a>{onLogout && <Button variant="ghost" size="sm" className={styles.quietButton} onClick={onLogout} disabled={busy}>Выйти</Button>}</div>{email && <span className={styles.account}>{email}</span>}</header>;
}
export function AdminErrorMessage({ error, retry, focusRef }: { error: Error | null; retry?: () => void; focusRef?: React.Ref<HTMLDivElement> }) {
  if (!error) return null;
  return <div ref={focusRef} role="alert" tabIndex={-1} className={styles.error}><p>{error.message}</p>{error instanceof AdminError && error.status === 401 && <a href="/admin" target="_blank" rel="noopener noreferrer">Войти в новой вкладке</a>}{retry && <Button variant="outline" size="sm" className={styles.secondaryButton} onClick={retry}>Повторить</Button>}</div>;
}
export function AdminEmpty({ filtered }: { filtered: boolean }) {
  return <div className={styles.empty}><Flower2 size={36} strokeWidth={1} aria-hidden="true" />{filtered ? <p>В этой подборке пока нет букетов.</p> : <><h2>Добавьте первый букет</h2><p>Выберите фото, укажите название и цену — остальное можно заполнить позже.</p></>}</div>;
}
