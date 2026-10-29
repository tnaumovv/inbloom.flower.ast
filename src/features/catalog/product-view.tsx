'use client';
import { useCatalog, CatalogNotice } from './live-catalog';
import { ProductGrid } from './catalog-view';
import { BouquetImage } from './bouquet-image';
import { formatPriceKzt } from './format-price';
import { buildBouquetWhatsAppLink, buildWhatsAppLink } from '@/features/contact/whatsapp';
import { Pill } from '@/features/storefront/shell';
import { Disclosures, TitleRow } from '@/features/storefront/sections';
import styles from './catalog.module.css';

export function ProductView({ slug }: { slug: string }) {
  const { snapshot } = useCatalog();
  const p = snapshot.bouquets.find(b => b.slug === slug);
  if (snapshot.status === 'unavailable') return <CatalogNotice />;
  if (!p) return <section className="error-page"><h1 className="display">Букет снят с витрины</h1><p>Выберите другую композицию или обсудите пожелания с флористом.</p><Pill href="/catalog">Выбрать букет</Pill>{' '}<Pill href={buildWhatsAppLink()} external>Написать флористу</Pill></section>;
  return <><CatalogNotice /><section className="product-detail"><div className="detail-photo"><span className="photo-fallback">Фото букета {p.name}</span><BouquetImage bouquet={p} /></div><div className="detail-copy"><h1 className="display">{p.name}</h1><p className={styles.detailCode}>Артикул: {p.id}</p><p className="detail-price">{formatPriceKzt(p.priceKzt)}</p><p className="detail-description">{p.description || 'Композиция из каталога In Bloom. Состав и актуальную стоимость уточнит флорист.'}</p><Pill href={buildBouquetWhatsAppLink(p)} variant="order-main" external>Заказать в WhatsApp</Pill><p className="detail-note">Наличие, состав и итоговую стоимость подтвердит флорист. Открытие чата — начало обсуждения заказа.</p>{Boolean(p.composition?.length) && <div className="composition"><h2>Состав букета</h2><ul>{p.composition?.map(item => <li key={item}>{item}</li>)}</ul></div>}</div></section><Disclosures items={[['Оплата', 'В магазине доступны оплата картой, наличными, переводом и QR. Способ оплаты заказа и возможную предоплату уточните у флориста.'], ['Доставка и самовывоз', 'Доставку по Астане, стоимость и удобное время согласуйте в WhatsApp. Самовывоз — проспект Женис, 8/1; готовность букета подтвердит флорист.']]} /><section className="section"><TitleRow title="Смотрите также" action={false} /><ProductGrid products={snapshot.bouquets.filter(b => b.id !== p.id).slice(0, 3)} /></section><div className="sticky-order"><span className="sticky-price">{formatPriceKzt(p.priceKzt)}</span><Pill href={buildBouquetWhatsAppLink(p)} external>Заказать в WhatsApp</Pill></div></>;
}
