import { describe, expect, it } from 'vitest';
import { exportPKCS8, generateKeyPair, jwtVerify } from 'jose';
import { createServiceToken } from '@/features/admin/google';

describe('Google service account adapter', () => {
  it('signs a scoped Google assertion and reuses its short-lived access token', async () => {
    const keys = await generateKeyPair('RS256', { extractable: true });
    const env = { GOOGLE_SERVICE_ACCOUNT_EMAIL: 'catalog@example.iam.gserviceaccount.com', GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: await exportPKCS8(keys.privateKey) };
    let calls = 0;
    const fetcher: typeof fetch = async (url, init) => {
      calls++; expect(String(url)).toBe('https://oauth2.googleapis.com/token');
      const form = new URLSearchParams(String(init?.body));
      expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
      const verified = await jwtVerify(form.get('assertion')!, keys.publicKey, { algorithms: ['RS256'], audience: 'https://oauth2.googleapis.com/token', issuer: env.GOOGLE_SERVICE_ACCOUNT_EMAIL });
      expect(verified.payload.scope).toBe('https://www.googleapis.com/auth/spreadsheets');
      return Response.json({ access_token: 'test-access-token', expires_in: 3600 });
    };
    const token = createServiceToken(env, fetcher);
    expect(await token()).toBe('test-access-token'); expect(await token()).toBe('test-access-token'); expect(calls).toBe(1);
  });
  it('returns a safe error for malformed credentials without leaking the key', async () => {
    const token = createServiceToken({ GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'private-test-secret' }, async () => { throw new Error('must not reach the network'); });
    await expect(token()).rejects.toThrow('Не удалось подключиться');
    try { await token(); } catch (error) { expect(String(error)).not.toContain('private-test-secret'); }
  });
});
