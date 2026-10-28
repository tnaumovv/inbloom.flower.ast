import 'server-only';
import { createHash } from 'node:crypto';
import { type AdminEnvironment } from './config';
import { AdminError } from './errors';
import { createServiceToken, googleJson, waitForGoogle } from './google';
import { adminColumns, draftValues, validateBouquetInput, type AdminBouquet, type BouquetDraft } from './model';

type Options = { env?: AdminEnvironment; fetcher?: typeof fetch; getToken?: () => Promise<string>; pause?: (ms: number) => Promise<void> };
const sameDraft = (left: BouquetDraft, right: BouquetDraft) => JSON.stringify(draftValues(left)) === JSON.stringify(draftValues(right));
export function createSheetEditor({ env = process.env, fetcher = fetch, getToken = createServiceToken(env, fetcher), pause = waitForGoogle }: Options = {}) {
  let queue = Promise.resolve();
  const range = env.GOOGLE_SHEET_RANGE || "'Каталог'!A1:I1001";
  const sheet = range.slice(0, range.lastIndexOf('!'));
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEET_ID || '')}/values/`;
  async function read() {
    if (!env.GOOGLE_SHEET_ID || !/^.+!A1:I1001$/.test(range)) throw new AdminError(503, 'Проверьте подключение листа каталога.');
    const body = await googleJson(fetcher, baseUrl + encodeURIComponent(range) + '?valueRenderOption=UNFORMATTED_VALUE&majorDimension=ROWS', { headers: { Authorization: `Bearer ${await getToken()}` } }, pause);
    const rows = body.values;
    if (!Array.isArray(rows) || !Array.isArray(rows[0]) || rows.length > 1001) throw new AdminError(502, 'Не удалось прочитать каталог. Проверьте лист Google Таблицы.');
    const headers: string[] = rows[0].map(value => String(value).trim().toLowerCase());
    if (headers.length !== 9 || new Set(headers).size !== 9 || adminColumns.some(value => !headers.includes(value.toLowerCase()))) throw new AdminError(502, 'Заголовки таблицы изменились. Восстановите девять столбцов каталога.');
    const ids = new Set<string>();
    const entries: { record: AdminBouquet; row: number }[] = [];
    rows.slice(1).forEach((raw, index) => {
      if (!Array.isArray(raw) || raw.every(value => !String(value ?? '').trim())) return;
      const cell = (name: string) => raw[headers.indexOf(name.toLowerCase())];
      const text = (name: string) => String(cell(name) ?? '').trim();
      const id = text('ID');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id)) throw new AdminError(502, 'В таблице есть строка без правильного уникального ID. Исправьте её в Google Таблице.');
      ids.add(id);
      const draft: BouquetDraft = { id, name: text('Название'), priceKzt: Number(text('Цена').replace(/[\s\u00a0\u202f₸]/g, '')) || 0, image: text('Фото'), description: text('Описание'), composition: text('Состав'), visible: ['true', 'да', '1'].includes(text('Показывать').toLowerCase()), order: text('Порядок') ? Number(cell('Порядок')) : index + 1, category: text('Категория') };
      const version = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
      entries.push({ record: { ...draft, version }, row: index + 2 });
    });
    return { entries, headers };
  }
  async function performSave(input: unknown, expectedVersion: string | null): Promise<AdminBouquet> {
    const draft = validateBouquetInput(input);
    for (let attempt = 0; attempt < 3; attempt++) {
      const { entries, headers } = await read();
      const found = entries.find(value => value.record.id === draft.id);
      if (found && sameDraft(found.record, draft)) return found.record;
      if ((expectedVersion === null && found) || (expectedVersion !== null && (!found || found.record.version !== expectedVersion))) throw new AdminError(409, 'Букет уже изменили. Откройте его заново, чтобы сохранить актуальные данные.');
      if (!found && entries.length >= 1000) throw new AdminError(422, 'В каталоге уже 1000 букетов. Обратитесь к тому, кто настраивает сайт.');
      const values = draftValues(draft);
      const row = headers.map(header => values[adminColumns.findIndex(column => column.toLowerCase() === header)]);
      const writeRange = found ? `${sheet}!A${found.row}:I${found.row}` : `${sheet}!A1:I1001`;
      const url = baseUrl + encodeURIComponent(writeRange) + (found ? '?valueInputOption=RAW' : ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS');
      try {
        await googleJson(fetcher, url, { method: found ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [row], majorDimension: 'ROWS' }) }, pause, 0);
      } catch { /* A lost response does not prove a failed write. Read the ID before retrying. */ }
      const verified = (await read()).entries.find(value => value.record.id === draft.id)?.record;
      if (verified && sameDraft(verified, draft)) return verified;
      if (attempt < 2) await pause(250 * 2 ** attempt);
    }
    throw new AdminError(502, 'Не удалось подтвердить сохранение. Поля сохранены в форме — попробуйте ещё раз.');
  }
  return {
    async list(): Promise<AdminBouquet[]> { return (await read()).entries.map(value => value.record); },
    save(input: unknown, expectedVersion: string | null): Promise<AdminBouquet> {
      const run = queue.then(() => performSave(input, expectedVersion));
      queue = run.then(() => {}, () => {}); return run;
    },
  };
}
export const adminSheet = createSheetEditor();
