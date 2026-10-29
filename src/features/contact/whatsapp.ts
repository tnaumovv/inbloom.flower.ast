import { siteConfig } from '@/config/site';
import { formatPriceKzt } from '@/features/catalog/format-price';
import type { Bouquet } from '@/features/catalog/types';

export const generalEnquiryMessage = 'Здравствуйте! Хочу заказать букет. Подскажите, пожалуйста, варианты и условия доставки.';
export const customBouquetMessage = 'Здравствуйте! Хочу обсудить индивидуальный букет. Подскажите, пожалуйста, какие варианты доступны.';

export function buildWhatsAppLink(message: string = generalEnquiryMessage): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function buildBouquetWhatsAppLink(bouquet: Pick<Bouquet, 'name' | 'priceKzt'> & Partial<Pick<Bouquet, 'id'>>): string {
  const productCode = bouquet.id ? `\nАртикул: ${bouquet.id}.` : '';
  return buildWhatsAppLink(`Здравствуйте! Хочу заказать «${bouquet.name}» — ${formatPriceKzt(bouquet.priceKzt)}.${productCode}`);
}
