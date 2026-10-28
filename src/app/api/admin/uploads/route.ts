import { adminResponse, jsonAdmin, readAdminJson, requireAdmin } from '@/features/admin/http';
import { createUploadTicket, validateImageFile, verifyUploadResult } from '@/features/admin/media';
import { AdminError } from '@/features/admin/errors';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return adminResponse(async () => {
    const session = await requireAdmin(request); const body = await readAdminJson(request);
    if (body.action === 'sign') { validateImageFile(body.file); return jsonAdmin(await createUploadTicket(session)); }
    if (body.action === 'complete' && typeof body.ticket === 'string' && body.result && typeof body.result === 'object' && !Array.isArray(body.result)) return jsonAdmin(await verifyUploadResult(body.result as Record<string, unknown>, body.ticket, session));
    throw new AdminError(400, 'Не удалось прочитать запрос загрузки.');
  });
}
