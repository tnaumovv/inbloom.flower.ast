import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createUploadTicket, validateImageFile, verifyImageReceipt, verifyUploadResult } from '@/features/admin/media';
import { signAdminToken } from '@/features/admin/auth';

const env = { SITE_URL: 'https://inbloom.example', ADMIN_GOOGLE_CLIENT_ID: 'test', ADMIN_EMAILS: 'owner@gmail.com', ADMIN_SESSION_SECRET: 'test-secret-with-at-least-thirty-two-characters', GOOGLE_SHEET_ID: 'test', GOOGLE_SHEETS_API_KEY: 'test-public-read-key', GOOGLE_SERVICE_ACCOUNT_EMAIL: 'test@example.com', GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'test', CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: '123', CLOUDINARY_API_SECRET: 'cloud-secret', CLOUDINARY_UPLOAD_PRESET: 'signed' };
const session = { email: 'owner@gmail.com', sub: '123', sid: 'session-1' };
describe('protected photo uploads', () => {
  it('allows supported phone photos within 10 MB and rejects unsafe formats and sizes', () => {
    expect(() => validateImageFile({ name: 'photo.heic', size: 1024, type: 'image/heic' })).not.toThrow();
    for (const file of [{ name: 'a.svg', type: 'image/svg+xml', size: 10 }, { name: 'a.jpg', type: 'image/jpeg', size: 10_000_001 }, { name: 'a.jpg', type: 'image/jpeg', size: 0 }]) expect(() => validateImageFile(file)).toThrow();
  });
  it('creates signed image-only upload parameters without exposing the secret', async () => {
    const upload = await createUploadTicket(session, env);
    expect(upload.url).toBe('https://api.cloudinary.com/v1_1/test-cloud/image/upload');
    expect(upload.fields.public_id).toMatch(/^inbloom-bouquets\//);
    expect(upload.fields.overwrite).toBe('false');
    // Upload format conversion would bypass allowed_formats for disallowed inputs.
    expect(upload.fields).not.toHaveProperty('format');
    expect(JSON.stringify(upload)).not.toContain(env.CLOUDINARY_API_SECRET);
  });
  it('verifies provider signature AND server-fetched metadata, then binds receipt to the session and URL', async () => {
    const upload = await createUploadTicket(session, env);
    const version = 123;
    const result = { public_id: upload.fields.public_id, version, signature: createHash('sha1').update(`public_id=${upload.fields.public_id}&version=${version}${env.CLOUDINARY_API_SECRET}`).digest('hex'), bytes: 1 };
    const url = `https://res.cloudinary.com/test-cloud/image/upload/v123/${result.public_id}.webp`;
    const metadata = { ...result, resource_type: 'image', type: 'upload', format: 'webp', bytes: 50000, width: 900, height: 1200, secure_url: url };
    const fetcher: typeof fetch = async () => Response.json(metadata);
    const verified = await verifyUploadResult(result, upload.ticket, session, env, fetcher);
    const delivery = url.replace('/image/upload/', '/image/upload/f_webp/q_auto/');
    expect(verified.image).toBe(delivery);
    await expect(verifyImageReceipt(verified.receipt, delivery, session, env)).resolves.toBeUndefined();
    await expect(verifyImageReceipt(verified.receipt, 'https://evil.example/x.webp', session, env)).rejects.toThrow();
    await expect(verifyImageReceipt(verified.receipt, delivery, { ...session, sid: 'other' }, env)).rejects.toThrow();
    await expect(verifyUploadResult({ ...result, signature: 'forged' }, upload.ticket, session, env, fetcher)).rejects.toThrow();
    await expect(verifyUploadResult(result, upload.ticket, { ...session, sid: 'other' }, env, fetcher)).rejects.toThrow();
    await expect(verifyUploadResult(result, upload.ticket, session, env, async () => Response.json({ ...metadata, bytes: 20_000_000 }))).rejects.toThrow();
    await expect(verifyUploadResult(result, upload.ticket, session, env, async () => Response.json({ ...metadata, format: 'svg' }))).rejects.toThrow();
    await expect(verifyUploadResult(result, upload.ticket, session, env, async () => Response.json({ ...metadata, secure_url: 'https://res.cloudinary.com/another-cloud/image/upload/photo.webp' }))).rejects.toThrow();
    await expect(verifyUploadResult(result, 'forged-ticket', session, env, fetcher)).rejects.toThrow();
  });
  it.each(['jpg', 'png', 'heic'])('accepts a preset-allowed %s source and delivers a WebP derivative', async format => {
    const upload = await createUploadTicket(session, env);
    const publicId = upload.fields.public_id;
    const result = { public_id: publicId, version: 123, signature: createHash('sha1').update(`public_id=${publicId}&version=123${env.CLOUDINARY_API_SECRET}`).digest('hex') };
    const metadata = { ...result, resource_type: 'image', type: 'upload', format, bytes: 50000, width: 900, height: 1200, secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v123/${publicId}.${format}` };
    const verified = await verifyUploadResult(result, upload.ticket, session, env, async () => Response.json(metadata));
    expect(verified.image).toBe(`https://res.cloudinary.com/test-cloud/image/upload/f_webp/q_auto/v123/${publicId}.webp`);
  });
  it('rejects expired tickets and receipts', async () => {
    const past = Date.now() - 700_000;
    const upload = await createUploadTicket(session, env, past);
    await expect(verifyUploadResult({}, upload.ticket, session, env)).rejects.toThrow();
    const receipt = await signAdminToken({ sid: session.sid, image: 'https://example.com/photo.webp' }, 'image-receipt', 30, env, Date.now() - 60_000);
    await expect(verifyImageReceipt(receipt, 'https://example.com/photo.webp', session, env)).rejects.toThrow();
  });
});
