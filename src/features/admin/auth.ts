import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey } from 'jose';
import { allowedEmails, getAdminConfig, type AdminEnvironment } from './config';
import { AdminError } from './errors';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), { timeoutDuration: 5000 });
const issuer = 'inbloom-admin';
export type AdminIdentity = { email: string; sub: string };
export type AdminSession = AdminIdentity & { sid: string };
const secretKey = (env: AdminEnvironment) => new TextEncoder().encode(getAdminConfig(env).secret);

export async function signAdminToken(payload: Record<string, unknown>, purpose: string, lifetime: number, env: AdminEnvironment = process.env, now = Date.now()) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuer(issuer).setAudience(purpose)
    .setIssuedAt(Math.floor(now / 1000)).setExpirationTime(Math.floor(now / 1000) + lifetime).sign(secretKey(env));
}
export async function verifyAdminToken(token: string, purpose: string, env: AdminEnvironment = process.env, now = Date.now()) {
  try {
    return (await jwtVerify(token, secretKey(env), { algorithms: ['HS256'], issuer, audience: purpose, currentDate: new Date(now) })).payload;
  } catch { return null; }
}
export async function createAdminSession(identity: AdminIdentity, env: AdminEnvironment = process.env, now = Date.now()) {
  if (!allowedEmails(env).includes(identity.email.toLowerCase())) throw new AdminError(403, 'У этого аккаунта нет доступа к каталогу.');
  return signAdminToken({ ...identity, email: identity.email.toLowerCase(), sid: randomUUID() }, 'session', 8 * 3600, env, now);
}
export async function readAdminSession(token: string, env: AdminEnvironment = process.env, now = Date.now()): Promise<AdminSession | null> {
  const payload = await verifyAdminToken(token, 'session', env, now);
  if (!payload || typeof payload.email !== 'string' || typeof payload.sub !== 'string' || typeof payload.sid !== 'string' || !allowedEmails(env).includes(payload.email)) return null;
  return { email: payload.email, sub: payload.sub, sid: payload.sid };
}
export async function createLoginNonce(env: AdminEnvironment = process.env, now = Date.now()) {
  const nonce = randomBytes(24).toString('hex');
  return { nonce, cookie: await signAdminToken({ nonce }, 'login', 600, env, now) };
}
export async function readLoginNonce(cookie: string, env: AdminEnvironment = process.env, now = Date.now()) {
  const payload = await verifyAdminToken(cookie, 'login', env, now);
  return typeof payload?.nonce === 'string' ? payload.nonce : null;
}
export async function verifyGoogleCredential(credential: string, nonce: string, env: AdminEnvironment = process.env, keySet: CryptoKey | JWTVerifyGetKey = googleKeys): Promise<AdminIdentity> {
  try {
    const { payload } = await jwtVerify(credential, keySet, {
      algorithms: ['RS256'], audience: getAdminConfig(env).clientId,
      issuer: ['https://accounts.google.com', 'accounts.google.com'], requiredClaims: ['sub', 'exp', 'iat'], maxTokenAge: '10m',
    });
    if (!nonce || payload.nonce !== nonce || payload.email_verified !== true || typeof payload.email !== 'string' || !payload.sub || !allowedEmails(env).includes(payload.email.toLowerCase())) throw new Error();
    return { email: payload.email.toLowerCase(), sub: payload.sub };
  } catch { throw new AdminError(403, 'Не удалось подтвердить доступ. Выберите разрешённый Google-аккаунт и попробуйте снова.'); }
}
