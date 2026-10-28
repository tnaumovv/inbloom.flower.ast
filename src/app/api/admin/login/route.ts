import { adminResponse, assertSameOrigin, jsonAdmin, readAdminJson, requestCookie, setAdminCookie } from '@/features/admin/http';
import { createAdminSession, createLoginNonce, readLoginNonce, verifyGoogleCredential } from '@/features/admin/auth';
import { adminCookieName, getAdminConfig } from '@/features/admin/config';
import { AdminError } from '@/features/admin/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return adminResponse(async () => {
    const config = getAdminConfig(); const login = await createLoginNonce();
    const response = jsonAdmin({ clientId: config.clientId, nonce: login.nonce });
    setAdminCookie(response, 'nonce', login.cookie, 600); return response;
  });
}
export async function POST(request: Request) {
  return adminResponse(async () => {
    assertSameOrigin(request);
    const body = await readAdminJson(request, 20_000);
    const nonce = await readLoginNonce(requestCookie(request, adminCookieName('nonce')));
    if (!nonce || typeof body.credential !== 'string' || body.nonce !== nonce) throw new AdminError(403, 'Время входа истекло. Обновите страницу и войдите снова.');
    const identity = await verifyGoogleCredential(body.credential, nonce);
    const response = jsonAdmin({ ok: true });
    setAdminCookie(response, 'session', await createAdminSession(identity), 8 * 3600);
    setAdminCookie(response, 'nonce', '', 0); return response;
  });
}
