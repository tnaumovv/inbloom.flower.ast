import { AdminError } from './errors';

export async function adminFetch<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(new DOMException('Request timed out', 'TimeoutError')), 30_000);
  try {
    const response = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      signal: signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal,
    });
    const result = await response.json();
    if (!response.ok) throw new AdminError(response.status, result.message || 'Не удалось выполнить действие. Попробуйте снова.', result.fields);
    return result as T;
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError(502, 'Не удалось связаться с сайтом. Проверьте интернет и попробуйте ещё раз.');
  } finally {
    clearTimeout(timer);
  }
}
export type UploadedCandidate = { ticket: string; result: Record<string, unknown> };
export type UploadedPhoto = { image: string; receipt: string };
export async function uploadAdminPhoto(file: File, candidate: UploadedCandidate | null, onUploaded: (candidate: UploadedCandidate) => void): Promise<UploadedPhoto> {
  let uploaded = candidate;
  if (!uploaded) {
    const signed = await adminFetch<{ url: string; fields: Record<string, string>; ticket: string }>('/api/admin/uploads', { action: 'sign', file: { name: file.name, size: file.size, type: file.type } });
    const form = new FormData(); Object.entries(signed.fields).forEach(([key, value]) => form.append(key, value)); form.append('file', file);
    let response: Response;
    try { response = await fetch(signed.url, { method: 'POST', body: form, signal: AbortSignal.timeout(90000) }); }
    catch { throw new AdminError(502, 'Не удалось загрузить фото. Проверьте интернет и попробуйте ещё раз.'); }
    if (!response.ok) throw new AdminError(502, 'Фото не загрузилось. Попробуйте другой снимок или повторите позже.', { image: 'Проверьте формат, размер фото и доступность загрузки.' });
    uploaded = { ticket: signed.ticket, result: await response.json() }; onUploaded(uploaded);
  }
  return adminFetch<UploadedPhoto>('/api/admin/uploads', { action: 'complete', ...uploaded });
}
