import Link from 'next/link';
import { Gift, Palette, HeartHandshake, Truck, Store, MessagesSquare } from 'lucide-react';
import { IconTile } from './decoration';
import { siteConfig } from '@/config/site';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';
import { Featured } from '@/features/catalog/catalog-view';
import { Hero, TitleRow, CustomSection, AboutSection, Steps, ContactsSection, Disclosures } from './sections';
import { Pill } from './shell';
import { ReviewsSection } from './reviews';

export function HomePage() {
  return <main id="main">
    <Hero />
    <section className="container" id="bouquets">
      <TitleRow title="Букеты" subtitle={<>Выберите композицию<br />под ваш повод</>} />
      <Featured />
      <div className="more-row"><Pill href="/catalog" variant="outline">Посмотреть все</Pill></div>
    </section>
    <CustomSection />
    <section className="container section">
      <TitleRow title="Другие букеты" subtitle={<>Сравните цвета, форму<br />и стоимость</>} />
      <Featured secondary />
      <div className="more-row"><Pill href="/catalog" variant="outline">Посмотреть все</Pill></div>
    </section>
    <AboutSection />
    <section className="container section">
      <TitleRow title="Наш подход" action={false} />
      <div className="approach">{[
        ['Начинаем с повода', 'Расскажите, кому выбираете цветы и какое настроение хотите передать.'],
        ['Обсуждаем пожелания', 'Назовите любимые оттенки, цветы и ориентир по бюджету.'],
        ['Согласуем детали', 'Флорист уточнит состав, стоимость, оплату и удобный способ получения.'],
      ].map(([title, text], index) => <article key={title}><IconTile icon={[Gift, Palette, HeartHandshake][index]} /><h3 className="display">{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <DeliverySection />
    <ReviewsSection />
    <ContactsSection />
  </main>;
}

const faq = [
  ['Как заказать букет?', 'Выберите композицию и нажмите «Заказать в WhatsApp». Отправьте сообщение самостоятельно; флорист подтвердит наличие и согласует детали.'],
  ['Можно собрать индивидуальный букет?', 'Обсудите с флористом повод, цветы, оттенки и бюджет. Возможность сборки, состав и итоговая стоимость согласуются в переписке.'],
  ['Сколько стоит доставка?', 'Стоимость, адрес доставки и желаемое время уточните у флориста.'],
  ['Как забрать букет самостоятельно?', 'Студия находится по адресу: Астана, проспект Женис, 8/1. Перед визитом согласуйте готовность букета и график работы.'],
  ['Какие способы оплаты доступны?', 'В магазине доступны карта, наличные, перевод и QR. Для заказа через WhatsApp способ оплаты и возможную предоплату уточните у флориста.'],
  ['Где посмотреть полный ассортимент?', <Link key="florax" className="text-link" href={siteConfig.catalogueUrl} target="_blank" rel="noopener noreferrer">Открыть каталог Florax ↗</Link>],
  ['Когда работает студия?', 'Проверьте актуальный график в 2ГИС или уточните его по телефону +7 708 220 46 75.'],
] as const;

function DeliverySection() { return <section className="container section" id="delivery"><TitleRow title="Доставка и заказ" action={false} /><Steps /><div className="delivery-options"><div className="delivery-panels"><article className="delivery-panel"><IconTile icon={Truck} className="icon-tile-large" /><h2 className="display">Доставка<br />по Астане</h2><p>Укажите адрес и желаемую дату. Стоимость и время доставки согласуйте с флористом.</p><p>Наличие букета и возможность доставки подтверждаются в переписке.</p><Pill href={buildWhatsAppLink()} external>Уточнить доставку</Pill></article><article className="delivery-panel"><IconTile icon={Store} className="icon-tile-large" /><h2 className="display">Самовывоз<br />из студии</h2><p>{siteConfig.address}.</p><p>Согласуйте готовность букета и время визита. Актуальный график можно проверить в 2ГИС.</p><Pill href={siteConfig.mapUrl} variant="outline" external>Построить маршрут</Pill></article></div><section id="faq" className="faq-layout" aria-labelledby="faq-title"><div className="faq-intro"><IconTile icon={MessagesSquare} className="icon-tile-large" /><h2 className="display faq-heading" id="faq-title">Оплата и частые вопросы</h2><Pill href={buildWhatsAppLink()} external>Написать флористу</Pill></div><Disclosures items={faq} /></section></div></section>; }
