import 'server-only';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { signAdminToken, verifyAdminToken, type AdminSession } from './auth';
import { getAdminConfig, type AdminEnvironment } from './config';
import { AdminError } from './errors';
import { maxImageBytes } from './image-rules';
export { validateImageFile } from './image-rules';
function cloudSignature(fields: Record<string, string>, secret: string) {
  return createHash('sha1').update(Object.keys(fields).sort().map(key => `${key}=${fields[key]}`).join('&') + secret).digest('hex');
}
export async function createUploadTicket(session: AdminSession, env: AdminEnvironment = process.env, now = Date.now()) {
  const config = getAdminConfig(env);
  const publicId = `inbloom-bouquets/${randomUUID()}`;
  const parameters = { public_id: publicId, timestamp: String(Math.floor(now / 1000)), upload_preset: config.preset, overwrite: 'false', format: 'webp', transformation: 'c_limit,h_2000,w_2000' };
  return {
    url: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    fields: { ...parameters, api_key: config.cloudKey, signature: cloudSignature(parameters, config.cloudSecret) },
    ticket: await signAdminToken({ publicId, sid: session.sid }, 'upload-ticket', 600, env, now),
  };
}
export async function verifyUploadResult(result: Record<string, unknown>, ticket: string, session: AdminSession, env: AdminEnvironment = process.env, fetcher: typeof fetch = fetch) {
  const config = getAdminConfig(env);
  const payload = await verifyAdminToken(ticket, 'upload-ticket', env);
  const publicId = payload?.publicId;
  const version = Number(result.version);
  if (!payload || payload.sid !== session.sid || typeof publicId !== 'string' || result.public_id !== publicId || !Number.isSafeInteger(version) || version <= 0) throw new AdminError(403, 'Не удалось подтвердить загрузку. Выберите фото ещё раз.');
  const expected = cloudSignature({ public_id: publicId, version: String(version) }, config.cloudSecret);
  if (typeof result.signature !== 'string' || !/^[a-f0-9]{40}$/.test(result.signature) || !timingSafeEqual(Buffer.from(result.signature, 'hex'), Buffer.from(expected, 'hex'))) throw new AdminError(403, 'Не удалось подтвердить фотографию. Повторите загрузку.');
  let metadata: Record<string, unknown>;
  try {
    const response = await fetcher(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image/upload/${encodeURIComponent(publicId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${config.cloudKey}:${config.cloudSecret}`).toString('base64')}` },
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(); metadata = await response.json();
  } catch { throw new AdminError(502, 'Фото загружено, но пока не подтверждено. Попробуйте сохранить ещё раз.'); }
  const image = `https://res.cloudinary.com/${config.cloudName}/image/upload/v${version}/${publicId}.webp`;
  if (metadata.public_id !== publicId || metadata.version !== version || metadata.resource_type !== 'image' || metadata.type !== 'upload' || metadata.format !== 'webp'
    || typeof metadata.bytes !== 'number' || metadata.bytes <= 0 || metadata.bytes > maxImageBytes
    || typeof metadata.width !== 'number' || metadata.width < 1 || metadata.width > 2000 || typeof metadata.height !== 'number' || metadata.height < 1 || metadata.height > 2000 || metadata.secure_url !== image) throw new AdminError(422, 'Не удалось подготовить это фото. Выберите другое изображение.', { image: 'Фото не прошло проверку размера или формата.' });
  return { image, receipt: await signAdminToken({ image, publicId, sid: session.sid }, 'image-receipt', 8 * 3600, env) };
}
export async function verifyImageReceipt(receipt: string, image: string, session: AdminSession, env: AdminEnvironment = process.env) {
  const payload = await verifyAdminToken(receipt, 'image-receipt', env);
  if (!payload || payload.sid !== session.sid || payload.image !== image) throw new AdminError(403, 'Сначала загрузите фото через эту форму.', { image: 'Повторите загрузку фотографии.' });
}
