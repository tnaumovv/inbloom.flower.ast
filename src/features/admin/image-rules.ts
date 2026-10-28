import { AdminError } from './errors';
export const maxImageBytes = 10_000_000;
export function validateImageFile(file: unknown) {
  const value = file as { name?: unknown; type?: unknown; size?: unknown } | null;
  if (!value || typeof value.name !== 'string' || !/\.(jpe?g|png|webp|heic|heif)$/i.test(value.name)
    || typeof value.size !== 'number' || value.size <= 0 || value.size > maxImageBytes
    || (value.type && !['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(String(value.type)))) {
    throw new AdminError(422, 'Выберите JPG, PNG, WebP или HEIC размером до 10 МБ.', { image: 'Нужна фотография до 10 МБ. SVG, GIF и видео не поддерживаются.' });
  }
}
