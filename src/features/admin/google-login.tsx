'use client';
import Script from 'next/script';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminFetch } from './client';
import { AdminErrorMessage } from './admin-parts';
import styles from './admin.module.css';

type GoogleApi = { accounts: { id: { initialize: (options: { client_id: string; nonce: string; callback: (result: { credential: string }) => void; auto_select: boolean; ux_mode: string }) => void; renderButton: (element: HTMLElement, options: Record<string, unknown>) => void } } };
export function GoogleLogin() {
  const button = useRef<HTMLDivElement>(null); const started = useRef(false);
  const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false); const [error, setError] = useState<Error | null>(null);
  const prepare = useCallback(async () => {
    if (started.current) return; started.current = true;
    try {
      const { clientId, nonce } = await adminFetch<{ clientId: string; nonce: string }>('/api/admin/login');
      const google = (window as Window & { google?: GoogleApi }).google;
      if (!google || !button.current) throw new Error('Не удалось открыть вход через Google. Обновите страницу.');
      google.accounts.id.initialize({ client_id: clientId, nonce, auto_select: false, ux_mode: 'popup', callback: async ({ credential }) => {
        setBusy(true); setError(null);
        try { await adminFetch('/api/admin/login', { credential, nonce }); window.location.reload(); }
        catch (failure) { setError(failure as Error); setBusy(false); }
      } });
      google.accounts.id.renderButton(button.current, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'ru', width: 280 });
      setReady(true);
    } catch (failure) { setError(failure as Error); }
  }, []);
  return <div className={styles.loginActions} aria-busy={busy}><Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => { void prepare(); }} onError={() => setError(new Error('Google не загрузился. Проверьте интернет и повторите вход.'))} /><div ref={button} className={styles.googleButton} hidden={busy} />{(!ready || busy) && !error && <p role="status">{busy ? 'Входим в каталог…' : 'Готовим вход…'}</p>}<AdminErrorMessage error={error} />{error && <Button variant="outline" className={styles.secondaryButton} onClick={() => window.location.reload()}>Повторить вход</Button>}<noscript>Для входа и редактирования каталога включите JavaScript.</noscript></div>;
}
