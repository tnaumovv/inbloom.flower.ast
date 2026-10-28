import { describe, expect, it } from 'vitest';
import { createSheetEditor } from '@/features/admin/sheet';
import { validateBouquetInput } from '@/features/admin/model';

const headers = ['ID', 'Название', 'Цена', 'Фото', 'Описание', 'Состав', 'Показывать', 'Порядок', 'Категория'];
const base = { id: 'bouquet-test', name: 'Пионовый сад', priceKzt: 17000, image: 'https://example.com/flowers.jpg', description: '', composition: '', visible: true, order: 1, category: 'Авторские' };
function fixture(initial: unknown[][] = [headers]) {
  let rows = structuredClone(initial); let writes = 0; let uncertain = false; let fail = false;
  const calls: { url: string; body?: Record<string, unknown> }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input); const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body });
    if (fail) return new Response('', { status: 503 });
    if (!init?.method || init.method === 'GET') return Response.json({ values: rows.slice(0, 1001) });
    writes++;
    if (url.includes(':append')) rows.push(body.values[0]);
    else { const row = Number(decodeURIComponent(url).match(/!A(\d+):I\d+/)?.[1]); rows[row - 1] = body.values[0]; }
    if (uncertain) { uncertain = false; throw new TypeError('Connection lost after Google wrote the row'); }
    return Response.json({ updates: { updatedRows: 1 } });
  };
  const editor = createSheetEditor({ env: { GOOGLE_SHEET_ID: 'test', GOOGLE_SHEET_RANGE: "'Каталог'!A1:I1001" }, fetcher, getToken: async () => 'test-token', pause: async () => {} });
  return { editor, calls, get rows() { return rows; }, get writes() { return writes; }, setRows: (next: unknown[][]) => { rows = next; }, setUncertain: () => { uncertain = true; }, setFail: () => { fail = true; } };
}
describe('admin sheet editor', () => {
  it('validates hidden drafts as strictly as published bouquets', () => {
    expect(validateBouquetInput(base)).toEqual(base);
    for (const invalid of [{ priceKzt: 0 }, { priceKzt: true }, { order: true }, { visible: 'false' }, { image: 'javascript:alert(1)' }, { id: 'bad id' }, { name: '' }]) {
      expect(() => validateBouquetInput({ ...base, ...invalid, visible: invalid.visible ?? false })).toThrow();
    }
  });
  it('includes hidden rows and preserves stable IDs when editing', async () => {
    const f = fixture([headers, ['pink-cloud', 'Розовый', 10000, '/images/catalogue/a.webp', '', '', false, 2, '']]);
    const [old] = await f.editor.list();
    expect(old.visible).toBe(false);
    const updated = await f.editor.save({ ...old, name: 'Обновлённый', visible: true }, old.version);
    expect(updated.id).toBe('pink-cloud'); expect(updated.name).toBe('Обновлённый');
    expect(f.rows[1][6]).toBe(true);
  });
  it('creates with RAW values and maps columns by their existing headers', async () => {
    const reordered = ['Название', 'ID', ...headers.slice(2)];
    const f = fixture([reordered]);
    const saved = await f.editor.save({ ...base, description: '=IMPORTXML("bad")' }, null);
    expect(saved.id).toBe(base.id);
    expect(f.rows[1].slice(0, 2)).toEqual([base.name, base.id]);
    expect(f.rows[1][4]).toBe('=IMPORTXML("bad")');
    expect(f.calls.find(call => call.body)?.url).toContain('valueInputOption=RAW');
    expect(f.calls.find(call => !call.body)?.url).toContain('valueRenderOption=UNFORMATTED_VALUE');
  });
  it('rereads uncertain writes and repeated create IDs without duplicating rows', async () => {
    const f = fixture(); f.setUncertain();
    const first = await f.editor.save(base, null);
    const second = await f.editor.save(base, null);
    expect(first.id).toBe(second.id); expect(f.rows).toHaveLength(2); expect(f.writes).toBe(1);
  });
  it('serializes concurrent same-ID creates in one process', async () => {
    const f = fixture(); await Promise.all([f.editor.save(base, null), f.editor.save(base, null)]);
    expect(f.writes).toBe(1);
  });
  it('reuses a bounded empty row when physical row 1001 is occupied', async () => {
    const rows = Array.from({ length: 1000 }, (_, index) => index === 499 ? [] : [`existing-${index}`, `Букет ${index}`, 10000, '/images/catalogue/pink-cloud.webp', '', '', true, index, '']);
    const f = fixture([headers, ...rows]);
    const saved = await f.editor.save(base, null);
    expect(saved.id).toBe(base.id); expect(f.rows[500][0]).toBe(base.id);
    expect(f.rows).toHaveLength(1001); expect(f.writes).toBe(1);
  });
  it('does not write outside a physically full catalog', async () => {
    const rows = Array.from({ length: 1000 }, (_, index) => [`existing-${index}`, `Букет ${index}`, 10000, '/images/catalogue/pink-cloud.webp', '', '', true, index, '']);
    const f = fixture([headers, ...rows]);
    await expect(f.editor.save(base, null)).rejects.toMatchObject({ status: 422 });
    expect(f.writes).toBe(0);
  });
  it('rejects stale edits and conflicting creation IDs', async () => {
    const f = fixture(); const first = await f.editor.save(base, null);
    await f.editor.save({ ...base, priceKzt: 18000 }, first.version);
    await expect(f.editor.save({ ...base, name: 'Устаревшая форма' }, first.version)).rejects.toMatchObject({ status: 409 });
    await expect(f.editor.save({ ...base, name: 'Другой букет' }, null)).rejects.toMatchObject({ status: 409 });
    expect(f.rows[1][2]).toBe(18000);
  });
  it('rejects malformed headers, duplicate IDs and provider failure without preview data', async () => {
    await expect(fixture([['wrong']]).editor.list()).rejects.toThrow();
    const f = fixture(); await f.editor.save(base, null); f.setRows([...f.rows, f.rows[1]]);
    await expect(f.editor.list()).rejects.toThrow();
    const offline = fixture(); offline.setFail(); await expect(offline.editor.list()).rejects.toThrow();
  });
});
