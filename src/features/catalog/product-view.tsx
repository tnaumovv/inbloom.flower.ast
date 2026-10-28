'use client';
import { useCatalog, CatalogNotice } from './live-catalog';
import { ProductGrid } from './catalog-view';
import { formatPriceKzt } from './format-price';
import { buildBouquetWhatsAppLink } from '@/features/contact/whatsapp';
import { siteConfig } from '@/config/site';
import { Pill } from '@/features/storefront/shell';
import { Disclosures, TitleRow } from '@/features/storefront/sections';

export function ProductView({ slug }: { slug: string }) {
  const { snapshot } = useCatalog();
  const p = snapshot.bouquets.find(b => b.slug === slug);
  if (snapshot.status === 'unavailable') return <CatalogNotice />;
  if (!p) return <section className="error-page"><h1 className="display">Букет снят с витрины</h1><Pill href="/catalog">Выбрать другой букет</Pill></section>;
  return <><CatalogNotice /><section className="product-detail"><div className="detail-photo"><span className="photo-fallback">Фото букета {p.name}</span><img key={p.image} src={p.image} alt={p.imageAlt} width={600} height={800} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /></div><div className="detail-copy"><h1 className="display">{p.name}</h1><p className="detail-price">{formatPriceKzt(p.priceKzt)}</p>{p.description && <p className="detail-description">{p.description}</p>}<Pill href={buildBouquetWhatsAppLink(p)} variant="order-main" external>Заказать в WhatsApp</Pill><p className="detail-note">Заказ подтверждается в переписке.</p>{Boolean(p.composition?.length) && <div className="composition"><h2>Состав букета</h2><ul>{p.composition?.map(item => <li key={item}>{item}</li>)}</ul></div>}</div></section><Disclosures items={[['Оплата', siteConfig.paymentMethods], ['Доставка и самовывоз', `Доставка по Астане. Самовывоз — ${siteConfig.address}.`]]} /><section className="section"><TitleRow title="Смотрите также" action={false} /><ProductGrid products={snapshot.bouquets.filter(b => b.id !== p.id).slice(0, 3)} /></section><div className="sticky-order"><span className="sticky-price">{formatPriceKzt(p.priceKzt)}</span><Pill href={buildBouquetWhatsAppLink(p)} external>Заказать в WhatsApp</Pill></div></>;
}
