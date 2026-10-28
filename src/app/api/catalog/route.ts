import { getCatalog } from '@/features/catalog/sheets';
export const dynamic = 'force-dynamic';
export async function GET() {
  const snapshot = await getCatalog();
  return Response.json(snapshot, { status: snapshot.status === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store, max-age=0', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store' } });
}
