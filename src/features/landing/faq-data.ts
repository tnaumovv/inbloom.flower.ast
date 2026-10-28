import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';

export type FaqItem = Readonly<{
  id: string;
  question: string;
  answer: ReactNode;
  link?: Readonly<{ label: string; href: string }>;
}>;

// Address, weekly hours, delivery and payment: 2GIS, checked 2026-10-29.
// Source receipts and unconfirmed terms: docs/assets/shop-research.json.
export const faqItems: readonly FaqItem[] = [
  {
    id: 'order',
    question: 'Как заказать букет?',
    answer: 'Выберите букет и нажмите «Заказать». Откроется WhatsApp с названием и ценой — добавьте дату и отправьте сообщение.',
  },
  {
    id: 'delivery',
    question: 'Есть ли доставка?',
    answer: 'Да, доставляем цветы по Астане.',
  },
  {
    id: 'location',
    question: 'Где забрать букет?',
    answer: `В студии: ${siteConfig.address}.`,
    link: { label: 'Маршрут в 2ГИС', href: siteConfig.mapUrl },
  },
  {
    id: 'payment',
    question: 'Как оплатить?',
    answer: siteConfig.paymentMethods,
  },
  {
    id: 'custom',
    question: 'Можно заказать свой букет?',
    answer: 'Да. Укажите любимые цветы, оттенки и бюджет. Можно приложить фото.',
  },
  {
    id: 'hours',
    question: 'Когда работает студия?',
    answer: siteConfig.openingHours.map(({ days, time }) => `${days} ${time}`).join(' · '),
  },
];
