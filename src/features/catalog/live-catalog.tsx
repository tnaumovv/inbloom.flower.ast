'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CatalogSnapshot } from './types';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';

const CatalogContext = createContext<{ snapshot: CatalogSnapshot; retry: () => void } | null>(null);
export function CatalogProvider({ initial, children }: { initial: CatalogSnapshot; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(initial);
  const run = useRef<() => void>(() => {});
  useEffect(() => {
    let stopped = false, running = false, failures = 0;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    const update = async () => {
      if (running || stopped || document.hidden) return;
      clearTimeout(timer); running = true; controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 7000);
      try {
        const response = await fetch('/api/catalog', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Catalogue unavailable');
        const next: CatalogSnapshot = await response.json();
        if (!Array.isArray(next.bouquets) || next.status !== 'ok') throw new Error('Invalid catalogue');
        if (!stopped) setSnapshot(current => current.revision === next.revision && current.status === next.status ? current : next);
        failures = 0;
      } catch {
        if (!stopped) { failures++; setSnapshot(current => ({ ...current, bouquets: [], status: 'unavailable', revision: 'unavailable' })); }
      } finally {
        clearTimeout(timeout); running = false;
        if (!stopped) timer = setTimeout(update, Math.min(5000 * 2 ** failures, 60000));
      }
    };
    const resume = () => { if (!document.hidden) { failures = 0; void update(); } };
    run.current = resume;
    timer = setTimeout(update, 5000);
    window.addEventListener('focus', resume); window.addEventListener('online', resume); document.addEventListener('visibilitychange', resume);
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); window.removeEventListener('focus', resume); window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume); };
  }, []);
  return <CatalogContext.Provider value={{ snapshot, retry: () => run.current() }}>{children}</CatalogContext.Provider>;
}
export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('CatalogProvider missing');
  return value;
}
export function CatalogNotice() {
  const { snapshot, retry } = useCatalog();
  if (snapshot.status === 'unavailable') return <div className="catalog-notice" role="status"><p>Не удалось обновить каталог. Попробуйте ещё раз или уточните букеты и цены у флориста.</p><button className="pill outline" onClick={retry}>Попробовать снова</button>{' '}<a className="pill" href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">Написать флористу</a></div>;
  return null;
}
