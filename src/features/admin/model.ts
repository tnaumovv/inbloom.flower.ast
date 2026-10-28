import { parseSheet } from '@/features/catalog/parse-sheet';
import { AdminError } from './errors';

export const adminColumns = ['ID', 'Название', 'Цена', 'Фото', 'Описание', 'Состав', 'Показывать', 'Порядок', 'Категория'] as const;
export type BouquetDraft = { id: string; name: string; priceKzt: number; image: string; description: string; composition: string; visible: boolean; order: number; category: string };
export type AdminBouquet = BouquetDraft & { version: string };
export function validateBouquetInput(input: unknown): BouquetDraft {
  if (!input || typeof input !== 'object') throw new AdminError(400, 'Заполните форму букета.');
  const value = input as Record<string, unknown>;
  const str = (key: string) => typeof value[key] === 'string' ? (value[key] as string).trim() : '';
  const draft: BouquetDraft = { id: str('id'), name: str('name'), priceKzt: Number(value.priceKzt), image: str('image'), description: str('description'), composition: str('composition'), visible: value.visible === true, order: Number(value.order ?? 0), category: str('category') };
  const fields: Record<string, string> = {};
  if (!draft.name || draft.name.length > 120) fields.name = 'Укажите название до 120 знаков.';
  if (typeof value.priceKzt !== 'number' || !Number.isSafeInteger(draft.priceKzt) || draft.priceKzt <= 0 || draft.priceKzt > 100_000_000) fields.priceKzt = 'Укажите целую цену в тенге, больше нуля.';
  if (!draft.image) fields.image = 'Добавьте фотографию букета.';
  if (typeof value.visible !== 'boolean') fields.visible = 'Выберите, показывать ли букет на сайте.';
  if (draft.description.length > 3000) fields.description = 'Сократите описание до 3000 знаков.';
  if (draft.composition.length > 4000) fields.composition = 'Сократите состав до 4000 знаков.';
  if (draft.category.length > 80) fields.category = 'Сократите категорию до 80 знаков.';
  if ((value.order !== undefined && typeof value.order !== 'number') || !Number.isFinite(draft.order) || draft.order < 0) fields.order = 'Укажите число от нуля.';
  if (Object.keys(fields).length) throw new AdminError(422, 'Проверьте выделенные поля.', fields);
  try { parseSheet([adminColumns, [draft.id, draft.name, draft.priceKzt, draft.image, draft.description, draft.composition, true, draft.order, draft.category]]); }
  catch { throw new AdminError(422, 'Проверьте название, цену и фотографию букета.', { image: 'Фото должно быть доступным изображением.', id: 'Откройте форму заново: не удалось подтвердить ID букета.' }); }
  return draft;
}
export function draftValues(draft: BouquetDraft): unknown[] {
  return [draft.id, draft.name, draft.priceKzt, draft.image, draft.description, draft.composition, draft.visible, draft.order, draft.category];
}
