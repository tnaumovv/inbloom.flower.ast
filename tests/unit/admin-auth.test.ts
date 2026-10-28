import { describe, expect, it } from 'vitest';
import { generateKeyPair, SignJWT } from 'jose';
import { createAdminSession, readAdminSession, createLoginNonce, readLoginNonce, verifyGoogleCredential } from '@/features/admin/auth';
import { getAdminSetupIssues } from '@/features/admin/config';
import { assertSameOrigin } from '@/features/admin/http';

const env = {
  NODE_ENV: 'test', SITE_URL: 'https://inbloom.example',
  ADMIN_GOOGLE_CLIENT_ID: 'test.apps.googleusercontent.com', ADMIN_EMAILS: 'owner@gmail.com',
  ADMIN_SESSION_SECRET: 'test-secret-with-at-least-thirty-two-characters',
  GOOGLE_SHEET_ID: 'test-sheet', GOOGLE_SERVICE_ACCOUNT_EMAIL: 'test@example.iam.gserviceaccount.com',
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'test-private-key',
  CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: '123', CLOUDINARY_API_SECRET: 'test-cloud-secret',
  CLOUDINARY_UPLOAD_PRESET: 'catalog-signed',
};

describe('admin boundary', () => {
  it('fails closed without configuration and does not reveal secrets', () => {
    expect(getAdminSetupIssues({})).toContain('Вход через Google');
    expect(getAdminSetupIssues(env)).toEqual([]);
    expect(getAdminSetupIssues({ ...env, ADMIN_SESSION_SECRET: 'short' })).toContain('Защита входа');
  });
  it('accepts only signed, unexpired sessions and checks current allowlist', async () => {
    const now = Date.now();
    const token = await createAdminSession({ sub: 'google-123', email: 'owner@gmail.com' }, env, now);
    const session = await readAdminSession(token, env, now);
    expect(session).toMatchObject({ email: 'owner@gmail.com', sub: 'google-123' });
    expect(session?.sid).toBeTruthy();
    expect(await readAdminSession(token.slice(0, -5) + 'xxxxx', env, now)).toBeNull();
    expect(await readAdminSession(token, env, now + 8 * 3600_000 + 1000)).toBeNull();
    expect(await readAdminSession(token, { ...env, ADMIN_EMAILS: 'other@gmail.com' }, now)).toBeNull();
    expect(await readAdminSession(token, { ...env, ADMIN_SESSION_SECRET: 'another-long-secret-with-thirty-two-characters' }, now)).toBeNull();
  });
  it('expires and authenticates login nonces', async () => {
    const now = Date.now();
    const login = await createLoginNonce(env, now);
    expect(login.nonce.length).toBeGreaterThanOrEqual(32);
    expect(await readLoginNonce(login.cookie, env, now)).toBe(login.nonce);
    expect(await readLoginNonce(login.cookie, env, now + 601_000)).toBeNull();
    expect(await readLoginNonce('forged', env, now)).toBeNull();
  });
  it('requires the configured same origin for writes', () => {
    expect(() => assertSameOrigin(new Request('https://inbloom.example/api/admin/bouquets', { method: 'POST', headers: { origin: 'https://inbloom.example' } }), env)).not.toThrow();
    for (const origin of ['', 'https://evil.example', 'null']) {
      expect(() => assertSameOrigin(new Request('https://inbloom.example/api/admin/bouquets', { method: 'POST', headers: { origin } }), env)).toThrow();
    }
  });
  it('verifies Google signature, audience, issuer, nonce and verified allowlisted email', async () => {
    const keys = await generateKeyPair('RS256');
    const make = (claims: Record<string, unknown> = {}, audience = env.ADMIN_GOOGLE_CLIENT_ID, issuer = 'https://accounts.google.com') =>
      new SignJWT({ email: 'owner@gmail.com', email_verified: true, nonce: 'login-nonce', ...claims })
        .setProtectedHeader({ alg: 'RS256' }).setSubject('google-123').setAudience(audience).setIssuer(issuer).setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
    expect(await verifyGoogleCredential(await make(), 'login-nonce', env, keys.publicKey)).toEqual({ sub: 'google-123', email: 'owner@gmail.com' });
    for (const token of [await make({ email_verified: false }), await make({ email: 'stranger@gmail.com' }), await make({ nonce: 'other' }), await make({}, 'wrong-client'), await make({}, undefined, 'https://evil.example')]) {
      await expect(verifyGoogleCredential(token, 'login-nonce', env, keys.publicKey)).rejects.toThrow();
    }
  });
});
