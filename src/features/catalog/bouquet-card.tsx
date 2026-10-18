import Image from 'next/image';
import { LinkButton } from '@/components/ui/link-button';
import { buildBouquetWhatsAppLink } from '@/features/contact/whatsapp';
import { formatPriceKzt } from './format-price';
import type { Bouquet } from './types';
import styles from './showcase.module.css';

export function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  return <article className={styles.card} aria-labelledby={`bouquet-${bouquet.slug}`}>
    <div className={styles.imageWrap}><Image src={bouquet.image} alt={bouquet.imageAlt} fill sizes="(min-width: 1024px) 25vw, (min-width: 600px) 360px, 75vw" className={styles.image}/></div>
    <h3 id={`bouquet-${bouquet.slug}`}>{bouquet.name}</h3>
    <p className={styles.price}>{formatPriceKzt(bouquet.priceKzt)}</p>
    <LinkButton href={buildBouquetWhatsAppLink(bouquet)} external className={styles.orderLink}><span aria-hidden="true">Заказать в WhatsApp</span><span className="sr-only">Заказать {bouquet.name} в WhatsApp</span></LinkButton>
  </article>;
}
