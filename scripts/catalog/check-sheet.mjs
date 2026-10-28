// Reads environment already supplied by the host; never prints the API key.
const id = process.env.GOOGLE_SHEET_ID;
const key = process.env.GOOGLE_SHEETS_API_KEY;
if (!id || !key) { console.error('Set GOOGLE_SHEET_ID and GOOGLE_SHEETS_API_KEY in the server environment.'); process.exit(1); }
const range = process.env.GOOGLE_SHEET_RANGE || "'Каталог'!A1:I1001";
const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}`);
url.searchParams.set('valueRenderOption', 'UNFORMATTED_VALUE');
try {
 const r = await fetch(url, { headers: { 'X-Goog-Api-Key': key }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
 if (!r.ok) throw new Error(`Google Sheets HTTP ${r.status}. Check API activation, key restrictions and sheet read access.`);
 const data = await r.json(); const { parseSheet } = await import('../../src/features/catalog/parse-sheet.ts'); const bouquets = parseSheet(data.values); console.log(JSON.stringify({ activeBouquets: bouquets.length, range: data.range, valid: true }));
} catch (e) { console.error(e instanceof Error ? e.message : 'Connection failed'); process.exit(1); }
