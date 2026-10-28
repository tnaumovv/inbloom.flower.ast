import { adminResponse, jsonAdmin, requireAdmin, setAdminCookie } from '@/features/admin/http';
export async function POST(request: Request) {
  return adminResponse(async () => { await requireAdmin(request); const response = jsonAdmin({ ok: true }); setAdminCookie(response, 'session', '', 0); return response; });
}
