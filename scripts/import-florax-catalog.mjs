import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import nextEnv from '@next/env';
import { importPKCS8, SignJWT } from 'jose';
import { parseSheet } from '../src/features/catalog/parse-sheet.ts';

const columns = ['ID', 'Название', 'Цена', 'Фото', 'Описание', 'Состав', 'Показывать', 'Порядок', 'Категория'];

/** Build new rows only; existing names, prices, photos and visibility remain owned by the shop. */
export function createImportPlan(rows, products) {
  const headers = rows[0]?.map(value => String(value).trim().toLowerCase());
  if (!headers || headers.length !== columns.length || columns.some(column => !headers.includes(column.toLowerCase()))) throw new Error('Expected the nine catalogue columns.');
  const currentVisible = parseSheet(rows).length;
  const idColumn = headers.indexOf('id');
  const orderColumn = headers.indexOf('порядок');
  const existing = rows.slice(1).filter(row => Array.isArray(row) && row.some(value => String(value ?? '').trim()));
  const ids = new Set();
  for (const row of existing) {
    const id = String(row[idColumn] ?? '').trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id)) throw new Error('Existing catalogue has an invalid or duplicate ID.');
    ids.add(id);
  }
  let order = Math.max(0, ...existing.map((row, index) => row[orderColumn] === undefined || row[orderColumn] === '' ? index + 1 : Number(row[orderColumn])));
  const seen = new Set();
  const rowsToAppend = [];
  const preservedIds = [];
  const added = [];
  for (const product of products) {
    const id = product.existingSiteId || product.slug;
    if (seen.has(id)) throw new Error('Source catalogue has a duplicate ID.');
    seen.add(id);
    if (ids.has(id)) { preservedIds.push(id); continue; }
    const composition = (product.composition || []).map(item => `${item.name} — ${item.quantity} шт.`).join('; ');
    const values = [id, product.name, product.priceKzt, product.image, product.description || '', composition, true, ++order, ''];
    parseSheet([columns, values]);
    rowsToAppend.push(headers.map(header => values[columns.findIndex(column => column.toLowerCase() === header)]));
    added.push({ id, name: product.name, priceKzt: product.priceKzt, image: product.image });
  }
  if (rows.length + rowsToAppend.length > 1001) throw new Error('Import would exceed the catalogue limit of 1000 rows.');
  return { sourceCount: products.length, currentRows: existing.length, currentVisible, preservedIds, added, rowsToAppend, expectedRows: existing.length + rowsToAppend.length, expectedVisible: currentVisible + rowsToAppend.length };
}

async function requestJson(url, init = {}) {
  let response;
  try { response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error('Google request failed. No credentials or provider response are printed.'); }
  if (!response.ok) throw new Error(`Google request returned HTTP ${response.status}.`);
  return response.json();
}

async function serviceToken(env) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) throw new Error('Service-account credentials are required to apply the import.');
  const key = await importPKCS8(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'), 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets' })
    .setProtectedHeader({ alg: 'RS256' }).setIssuer(env.GOOGLE_SERVICE_ACCOUNT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('1h').sign(key);
  const body = await requestJson('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (typeof body.access_token !== 'string' || !body.access_token) throw new Error('Google did not issue an access token.');
  return body.access_token;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--apply', '--dry-run'].includes(arg)) || (args.includes('--apply') && args.includes('--dry-run'))) throw new Error('Usage: node scripts/import-florax-catalog.mjs [--dry-run | --apply]');
  const apply = args.includes('--apply');
  const root = fileURLToPath(new URL('../', import.meta.url));
  nextEnv.loadEnvConfig(root);
  const env = process.env;
  if (!env.GOOGLE_SHEET_ID || !env.GOOGLE_SHEETS_API_KEY) throw new Error('Configure GOOGLE_SHEET_ID and GOOGLE_SHEETS_API_KEY first.');
  const range = env.GOOGLE_SHEET_RANGE || "'Каталог'!A1:I1001";
  if (!/^.+!A1:I1001$/.test(range)) throw new Error('Expected catalogue range A1:I1001.');
  const manifest = JSON.parse(await readFile(new URL('../docs/assets/florax-catalog-2026-10-29.json', import.meta.url), 'utf8'));
  for (const product of manifest.products) {
    if (!/^\/images\/[\w./-]+$/.test(product.image) || product.image.includes('..')) throw new Error('Import images must be local catalogue assets.');
    if (!(await stat(new URL(`../public${product.image}`, import.meta.url))).isFile()) throw new Error('Missing imported catalogue image.');
  }
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEET_ID)}/values/${encodeURIComponent(range)}`;
  const read = async () => (await requestJson(`${base}?valueRenderOption=UNFORMATTED_VALUE&majorDimension=ROWS`, { headers: { 'X-Goog-Api-Key': env.GOOGLE_SHEETS_API_KEY } })).values;
  const before = await read();
  const plan = createImportPlan(before, manifest.products);
  const summary = { mode: apply ? 'apply' : 'dry-run', ...plan };
  delete summary.rowsToAppend;
  if (!apply || !plan.rowsToAppend.length) { console.log(JSON.stringify(summary, null, 2)); return; }
  const token = await serviceToken(env);
  // Re-read after authentication so concurrent admin changes are included in the final plan.
  const latest = await read();
  const fresh = createImportPlan(latest, manifest.products);
  if (!fresh.rowsToAppend.length) { console.log(JSON.stringify({ mode: 'apply', added: [], verified: true }, null, 2)); return; }
  try {
    // INSERT_ROWS appends to the existing table. No existing cell is rewritten or cleared.
    await requestJson(`${base}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ majorDimension: 'ROWS', values: fresh.rowsToAppend }),
    });
  } catch { /* An uncertain write must be read back, never blindly retried. */ }
  const after = await read();
  const verified = createImportPlan(after, manifest.products);
  const idColumn = after[0].findIndex(value => String(value).toLowerCase() === 'id');
  const actual = new Map(after.slice(1).map(row => [row[idColumn], row]));
  const normalized = row => columns.map((_, index) => row?.[index] ?? '');
  if (verified.rowsToAppend.length || fresh.rowsToAppend.some(row => JSON.stringify(normalized(actual.get(row[idColumn]))) !== JSON.stringify(normalized(row)))) {
    throw new Error('Import could not be fully verified. Run --dry-run to inspect; an automatic append retry was not attempted.');
  }
  console.log(JSON.stringify({ mode: 'apply', added: fresh.added, preservedIds: fresh.preservedIds, totalRows: verified.currentRows, activeBouquets: verified.currentVisible, verified: true }, null, 2));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => { console.error(error instanceof Error ? error.message : 'Import failed.'); process.exitCode = 1; });
}
