import 'server-only';
import { NextResponse } from 'next/server';
import { readAdminSession, type AdminSession } from './auth';
import { adminCookieName, getAdminConfig, type AdminEnvironment } from './config';
import { AdminError } from './errors';

const noStore = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Cookie' };
export function jsonAdmin(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: noStore }); }
export async function adminResponse(action: () => Promise<NextResponse>) {
  try { return await action(); }
  catch (error) {
    return error instanceof AdminError ? jsonAdmin({ message: error.message, fields: error.fields }, error.status)
      : jsonAdmin({ message: 'Не удалось выполнить действие. Попробуйте ещё раз.' }, 502);
  }
}
export function requestCookie(request: Request, name: string) {
  const cookie = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return cookie?.slice(name.length + 1) || '';
}
export function assertSameOrigin(request: Request, env: AdminEnvironment = process.env) {
  const origin = getAdminConfig(env).origin || new URL(request.url).origin;
  if (!request.headers.get('origin') || request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new AdminError(403, 'Запрос отклонён. Откройте админку на адресе сайта.');
}
export async function requireAdmin(request: Request): Promise<AdminSession> {
  getAdminConfig();
  const session = await readAdminSession(requestCookie(request, adminCookieName('session')));
  if (!session) throw new AdminError(401, 'Войдите через Google, чтобы продолжить.');
  if (!['GET', 'HEAD'].includes(request.method)) assertSameOrigin(request);
  return session;
}
export async function readAdminJson(request: Request, limit = 64 * 1024): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new AdminError(415, 'Не удалось прочитать форму. Обновите страницу.');
  const reader = request.body?.getReader();
  if (!reader) throw new AdminError(400, 'Заполните форму.');
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new AdminError(413, 'В форме слишком много данных. Сократите описание.'); }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch (error) { if (error instanceof AdminError) throw error; throw new AdminError(400, 'Не удалось прочитать форму. Попробуйте снова.'); }
}
export function setAdminCookie(response: NextResponse, kind: 'session' | 'nonce', value: string, maxAge: number) {
  response.cookies.set(adminCookieName(kind), value, { httpOnly: true, secure: getAdminConfig().secure, sameSite: 'lax', path: '/', maxAge });
}
