import 'server-only';
import { importPKCS8, SignJWT } from 'jose';
import { type AdminEnvironment } from './config';
import { AdminError } from './errors';

export const waitForGoogle = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds));
export async function googleJson(fetcher: typeof fetch, url: string, init: RequestInit, pause = waitForGoogle, retries = 2): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetcher(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt < retries) { await pause(250 * 2 ** attempt); continue; }
        throw new Error();
      }
      const text = await response.text(); if (text.length > 2_000_000) throw new Error();
      return JSON.parse(text);
    } catch {
      if (attempt < retries) { await pause(250 * 2 ** attempt); continue; }
      throw new AdminError(502, 'Google Таблица сейчас недоступна. Изменения не подтверждены — попробуйте ещё раз.');
    }
  }
  throw new AdminError(502, 'Не удалось связаться с Google Таблицей.');
}
export function createServiceToken(env: AdminEnvironment = process.env, fetcher: typeof fetch = fetch) {
  let cached: { value: string; until: number } | undefined;
  let pending: Promise<string> | undefined;
  return async function token(): Promise<string> {
    if (cached && cached.until > Date.now()) return cached.value;
    if (pending) return pending;
    pending = (async () => {
      try {
        const key = await importPKCS8((env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'), 'RS256');
        const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets' })
          .setProtectedHeader({ alg: 'RS256' }).setIssuer(env.GOOGLE_SERVICE_ACCOUNT_EMAIL!).setAudience('https://oauth2.googleapis.com/token')
          .setIssuedAt().setExpirationTime('1h').sign(key);
        const body = await googleJson(fetcher, 'https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
        if (typeof body.access_token !== 'string' || !body.access_token) throw new Error();
        const lifetime = Math.min(3600, Math.max(0, Number(body.expires_in) || 0));
        cached = { value: body.access_token, until: Date.now() + Math.max(0, lifetime - 60) * 1000 };
        return cached.value;
      } catch { throw new AdminError(502, 'Не удалось подключиться к Google Таблице. Проверьте доступ сервисного аккаунта.'); }
    })();
    try { return await pending; } finally { pending = undefined; }
  };
}
