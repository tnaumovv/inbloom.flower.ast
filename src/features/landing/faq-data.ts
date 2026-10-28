import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';

export type FaqItem = Readonly<{
  id: string;
  question: string;
  answer: ReactNode;
  link?: Readonly<{ label: string; href: string }>;
}>;

// Public source receipts and deliberately unconfirmed terms: docs/assets/shop-research.json.
export const faqItems: readonly FaqItem[] = [
  {
    id: 'order',
    question: 'Как оформить заказ?',
    answer: 'Выберите букет и нажмите «Заказать в WhatsApp» — откроется чат с названием и ценой. Отправьте сообщение и согласуйте с флористом наличие, состав, оплату и получение букета.',
  },
  {
    id: 'delivery',
    question: 'Есть ли доставка по Астане?',
    answer: 'Да, у In Bloom есть доставка цветов по Астане. Напишите флористу адрес и желаемое время — стоимость и возможность доставки к этому времени нужно согласовать при заказе.',
  },
  {
    id: 'location',
    question: 'Где находится магазин?',
    answer: `Ждём вас по адресу: ${siteConfig.address}. В карточке на карте можно посмотреть вход и построить маршрут.`,
    link: { label: 'Посмотреть на карте', href: siteConfig.mapUrl },
  },
  {
    id: 'payment',
    question: 'Как можно оплатить букет?',
    answer: 'В магазине можно оплатить картой, наличными, переводом или по QR-коду. Способ оплаты заказа с доставкой и условия предоплаты уточните у флориста в WhatsApp.',
  },
  {
    id: 'custom',
    question: 'Можно обсудить индивидуальный букет?',
    answer: 'Да, отправьте флористу пожелания по цветам, оттенкам и бюджету, а также фото для вдохновения. Возможность сборки, состав и итоговую стоимость согласуйте в переписке.',
  },
  {
    id: 'hours',
    question: 'Где посмотреть часы работы?',
    answer: 'График магазина указан в 2ГИС. Перед визитом в праздничные дни лучше уточнить время работы по телефону или в WhatsApp.',
    link: { label: 'График в 2ГИС', href: siteConfig.mapUrl },
  },
  {
    id: 'catalogue',
    question: 'Где посмотреть больше букетов?',
    answer: 'Больше композиций — в каталоге In Bloom. Наличие понравившегося букета и его стоимость на дату заказа уточните у флориста.',
    link: { label: 'Открыть каталог', href: siteConfig.catalogueUrl },
  },
];
