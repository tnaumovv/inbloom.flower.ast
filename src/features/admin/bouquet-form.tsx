'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Camera, Check, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminBouquet, BouquetDraft } from './model';
import { AdminError } from './errors';
import { validateImageFile } from './image-rules';
import { adminFetch, uploadAdminPhoto, type UploadedCandidate, type UploadedPhoto } from './client';
import { AdminErrorMessage } from './admin-parts';
import styles from './admin.module.css';

export function BouquetForm({ initial, onSaved, onClose }: { initial: AdminBouquet | null; onSaved: (bouquet: AdminBouquet) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<BouquetDraft>(() => initial || { id: `bouquet-${crypto.randomUUID()}`, name: '', priceKzt: 0, image: '', description: '', composition: '', category: '', order: 0, visible: true });
  const [original] = useState(() => JSON.stringify(draft));
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [previewFailed, setPreviewFailed] = useState(false);
  const candidate = useRef<UploadedCandidate | null>(null); const uploaded = useRef<UploadedPhoto | null>(null);
  const [busy, setBusy] = useState(''); const [error, setError] = useState<Error | null>(null);
  const form = useRef<HTMLFormElement>(null); const errorBox = useRef<HTMLDivElement>(null);
  const fields = error instanceof AdminError ? error.fields || {} : {};
  const dirty = JSON.stringify(draft) !== original || file !== null;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const set = <K extends keyof BouquetDraft>(key: K, value: BouquetDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const close = () => { if (!dirty || window.confirm('Закрыть форму? Несохранённые изменения будут потеряны.')) onClose(); };
  const choosePhoto = (next: File | undefined) => {
    if (!next) return;
    try { validateImageFile(next); setFile(next); setPreview(URL.createObjectURL(next)); setPreviewFailed(false); candidate.current = null; uploaded.current = null; setError(null); }
    catch (failure) { setError(failure as Error); }
  };
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setError(null);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const visible = submitter ? submitter.value === 'visible' : draft.visible;
    try {
      if (!file && !draft.image) throw new AdminError(422, 'Добавьте фотографию букета.', { image: 'Выберите фото из галереи или сделайте снимок.' });
      let photo = uploaded.current;
      if (file && !photo) { setBusy('Загружаем фото…'); photo = await uploadAdminPhoto(file, candidate.current, value => { candidate.current = value; }); uploaded.current = photo; }
      setBusy('Сохраняем букет…');
      const result = await adminFetch<{ bouquet: AdminBouquet }>('/api/admin/bouquets', { draft: { ...draft, image: photo?.image || draft.image, visible }, version: initial?.version ?? null, receipt: photo?.receipt });
      onSaved(result.bouquet);
    } catch (failure) {
      const issue = failure as Error; setError(issue);
      requestAnimationFrame(() => {
        const field = issue instanceof AdminError ? Object.keys(issue.fields || {})[0] : undefined;
        const target = field ? form.current?.elements.namedItem(field) : null;
        if (target instanceof HTMLElement) target.focus(); else errorBox.current?.focus();
      });
    } finally { setBusy(''); }
  }
  const errorFor = (key: string) => fields[key] ? <span id={`${key}-error`} className={styles.fieldError}>{fields[key]}</span> : null;
  const primaryVisible = initial ? initial.visible : true;
  return <section className={styles.editor}><Button variant="ghost" className={styles.backButton} onClick={close} disabled={Boolean(busy)}><ArrowLeft size={18} />К букетам</Button><div className={styles.editorHeading}><p className={styles.eyebrow}>{initial ? (initial.visible ? 'На сайте' : 'Скрыт с сайта') : 'Пополнение коллекции'}</p><h1>{initial ? 'Редактировать букет' : 'Новый букет'}</h1><p>Фото, название и цена — всё, что нужно для начала.</p></div>
    <form ref={form} onSubmit={save} className={styles.form} aria-busy={Boolean(busy)}>
      <fieldset disabled={Boolean(busy)} className={styles.formFields}>
        <div className={styles.photoField}><label htmlFor="bouquet-photo" className={styles.fieldLabel}>Фотография букета</label><div className={`${styles.photoPicker} ${preview || draft.image ? styles.hasPhoto : ''}`}>
          {(preview || draft.image) && !previewFailed && <img src={preview || draft.image} alt="Фотография выбранного букета" onError={() => setPreviewFailed(true)} />}
          <label htmlFor="bouquet-photo" className={styles.photoChoose}><Camera size={24} strokeWidth={1.5} aria-hidden="true" /><span>{file || draft.image ? 'Заменить фото' : 'Выбрать фото'}</span><small>{file ? file.name : 'Из галереи или с камеры'}</small></label>
          <input id="bouquet-photo" name="image" className={styles.fileInput} type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={event => { choosePhoto(event.target.files?.[0]); event.target.value = ''; }} aria-invalid={Boolean(fields.image)} aria-describedby={fields.image ? 'image-error' : 'photo-help'} />
        </div><p id="photo-help" className={styles.help}>JPG, PNG, WebP или HEIC · до 10 МБ</p>{errorFor('image')}</div>
        <div className={styles.mainFields}><label className={styles.field}><span>Название букета</span><input name="name" required maxLength={120} value={draft.name} onChange={event => set('name', event.target.value)} placeholder="Например, «Утро в саду»" aria-invalid={Boolean(fields.name)} aria-describedby={fields.name ? 'name-error' : undefined} />{errorFor('name')}</label>
        <label className={styles.field}><span>Цена, ₸</span><input name="priceKzt" required type="number" inputMode="numeric" min={1} max={100_000_000} step={1} value={draft.priceKzt || ''} onChange={event => set('priceKzt', Number(event.target.value))} placeholder="Например, 18500" aria-invalid={Boolean(fields.priceKzt)} aria-describedby={fields.priceKzt ? 'priceKzt-error' : undefined} />{errorFor('priceKzt')}</label>
        <label className={styles.field}><span>Описание <small>необязательно</small></span><textarea name="description" rows={3} maxLength={3000} value={draft.description} onChange={event => set('description', event.target.value)} placeholder="Расскажите о цветах и настроении букета" aria-invalid={Boolean(fields.description)} aria-describedby={fields.description ? 'description-error' : undefined} />{errorFor('description')}</label>
        <details className={styles.details}><summary>Состав, категория и порядок</summary><div className={styles.extraFields}><label className={styles.field}><span>Состав</span><textarea name="composition" rows={2} maxLength={4000} value={draft.composition} onChange={event => set('composition', event.target.value)} placeholder="Роза — 5 шт.; эвкалипт — 2 веточки" aria-invalid={Boolean(fields.composition)} />{errorFor('composition')}</label><label className={styles.field}><span>Категория</span><input name="category" maxLength={80} value={draft.category} onChange={event => set('category', event.target.value)} placeholder="Например, «Авторские»" aria-invalid={Boolean(fields.category)} />{errorFor('category')}</label><label className={styles.field}><span>Порядок на сайте</span><input name="order" type="number" min={0} step="any" value={draft.order} onChange={event => set('order', Number(event.target.value))} aria-invalid={Boolean(fields.order)} /><small className={styles.help}>Меньшее число — ближе к началу каталога.</small>{errorFor('order')}</label></div></details></div>
      </fieldset>
      <AdminErrorMessage error={error} focusRef={errorBox} />
      <div className={styles.saveBar}><Button type="submit" value={primaryVisible ? 'visible' : 'hidden'} className={styles.primaryButton} disabled={Boolean(busy)}>{busy ? <LoaderCircle size={18} className={styles.spinner} /> : <Check size={18} />}{busy || (initial ? 'Сохранить изменения' : 'Опубликовать')}</Button><Button type="submit" value={primaryVisible ? 'hidden' : 'visible'} variant="outline" className={styles.secondaryButton} disabled={Boolean(busy)}>{primaryVisible ? (initial ? 'Скрыть с сайта' : 'Сохранить скрытым') : 'Опубликовать'}</Button></div>
    </form></section>;
}
