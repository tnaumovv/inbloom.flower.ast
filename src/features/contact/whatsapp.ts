import { siteConfig } from '@/config/site';
import { formatPriceKzt } from '@/features/catalog/format-price';
import type { Bouquet } from '@/features/catalog/types';

export const generalEnquiryMessage = 'Здравствуйте! Хочу заказать букет. Подскажите, пожалуйста, варианты и условия доставки.';
export const customBouquetMessage = 'Здравствуйте! Хочу обсудить индивидуальный букет. Подскажите, пожалуйста, какие варианты доступны.';

export function buildWhatsAppLink(message: string = generalEnquiryMessage): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function buildBouquetWhatsAppLink(bouquet: Pick<Bouquet, 'name' | 'priceKzt'>): string {
  return buildWhatsAppLink(`Здравствуйте! Хочу заказать букет «${bouquet.name}» (${formatPriceKzt(bouquet.priceKzt)}). Подскажите, пожалуйста, наличие и варианты доставки.`);
}
