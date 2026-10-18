import { InteractiveTravelCard } from '@/components/ui/3d-card';
import { buildBouquetWhatsAppLink } from '@/features/contact/whatsapp';
import { formatPriceKzt } from './format-price';
import type { Bouquet } from './types';
import styles from './showcase.module.css';

export function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  return <article className={styles.card} aria-labelledby={`bouquet-${bouquet.slug}`}>
    <InteractiveTravelCard title={bouquet.name} titleId={`bouquet-${bouquet.slug}`} subtitle={formatPriceKzt(bouquet.priceKzt)} imageUrl={bouquet.image} imageAlt={bouquet.imageAlt} imagePosition={bouquet.imagePosition} actionText="Заказать в WhatsApp" actionLabel={`Заказать ${bouquet.name} в WhatsApp`} actionHref={buildBouquetWhatsAppLink(bouquet)}/>
  </article>;
}
