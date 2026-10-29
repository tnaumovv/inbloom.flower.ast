import { createHash } from 'node:crypto';
import { previewBouquets } from './data';
import { parseSheet } from './parse-sheet';
import type { CatalogSnapshot } from './types';

type Environment = Record<string, string | undefined>;
type LoaderOptions = { env?: Environment; fetcher?: typeof fetch; now?: () => number };
export function createCatalogLoader({ env, fetcher = fetch, now = Date.now }: LoaderOptions = {}) {
  let cache: { key: string; until: number; value: CatalogSnapshot } | undefined;
  let pending: { key: string; promise: Promise<CatalogSnapshot> } | undefined;
  return async function load(): Promise<CatalogSnapshot> {
    const config = env ?? process.env;
    const id = config.GOOGLE_SHEET_ID?.trim();
    const apiKey = config.GOOGLE_SHEETS_API_KEY?.trim();
    const range = config.GOOGLE_SHEET_RANGE?.trim() || "'Каталог'!A1:I1001";
    if (!id && !apiKey) return { bouquets: previewBouquets, source: 'preview', status: 'ok', revision: 'preview-2026-10-29-full-catalogue' };
    const unavailable: CatalogSnapshot = { bouquets: [], source: 'sheets', status: 'unavailable', revision: 'unavailable' };
    if (!id || !apiKey || !/^[\w-]+$/.test(id)) return unavailable;
    const key = createHash('sha256').update(id + range + apiKey).digest('hex');
    if (cache?.key === key && cache.until > now()) return cache.value;
    if (pending?.key === key) return pending.promise;
    const promise = (async (): Promise<CatalogSnapshot> => {
      let value = unavailable;
      try {
        const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}`);
        url.searchParams.set('valueRenderOption', 'UNFORMATTED_VALUE');
        url.searchParams.set('majorDimension', 'ROWS');
        const response = await fetcher(url, { cache: 'no-store', headers: { 'X-Goog-Api-Key': apiKey }, signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error('Google Sheets unavailable');
        const body = await response.text();
        if (body.length > 2_000_000) throw new Error('Catalogue too large');
        const bouquets = parseSheet(JSON.parse(body).values);
        value = { bouquets, source: 'sheets', status: 'ok', revision: createHash('sha256').update(JSON.stringify(bouquets)).digest('hex').slice(0, 20) };
      } catch { /* No secrets, provider errors or stale prices are returned to visitors. */ }
      cache = { key, until: now() + 2000, value };
      return value;
    })();
    pending = { key, promise };
    try { return await promise; } finally { if (pending?.promise === promise) pending = undefined; }
  };
}
export const getCatalog = createCatalogLoader();
