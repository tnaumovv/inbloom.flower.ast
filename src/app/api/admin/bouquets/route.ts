import { adminResponse, jsonAdmin, readAdminJson, requireAdmin } from '@/features/admin/http';
import { adminSheet } from '@/features/admin/sheet';
import { validateBouquetInput } from '@/features/admin/model';
import { verifyImageReceipt } from '@/features/admin/media';
import { AdminError } from '@/features/admin/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return adminResponse(async () => { await requireAdmin(request); return jsonAdmin({ bouquets: await adminSheet.list() }); });
}
export async function POST(request: Request) {
  return adminResponse(async () => {
    const session = await requireAdmin(request); const body = await readAdminJson(request);
    if (body.version !== null && typeof body.version !== 'string') throw new AdminError(400, 'Откройте форму букета заново.');
    const draft = validateBouquetInput(body.draft);
    const existing = (await adminSheet.list()).find(bouquet => bouquet.id === draft.id);
    if (!existing || existing.image !== draft.image) await verifyImageReceipt(typeof body.receipt === 'string' ? body.receipt : '', draft.image, session);
    return jsonAdmin({ bouquet: await adminSheet.save(draft, body.version) });
  });
}
