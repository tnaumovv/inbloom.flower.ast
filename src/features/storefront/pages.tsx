import { Gift, Palette, HeartHandshake, Truck, Store } from 'lucide-react';
import { CardAccent } from './decoration';
import { siteConfig } from '@/config/site';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';
import { Featured } from '@/features/catalog/catalog-view';
import { Hero, TitleRow, CustomSection, AboutSection, Steps, ContactsSection, OpeningHours } from './sections';
import { Pill } from './shell';
import { FaqAccordion } from '@/features/landing/faq-accordion';
import { faqItems } from '@/features/landing/faq-data';
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
      ].map(([title, text], index) => <article key={title}><CardAccent icon={[Gift, Palette, HeartHandshake][index]} /><h3 className="display">{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <DeliverySection />
    <ReviewsSection />
    <ContactsSection />
  </main>;
}

function DeliverySection() { return <section className="container section" id="delivery"><TitleRow title="Доставка и заказ" action={false} /><Steps /><div className="delivery-options"><div className="delivery-panels"><article className="delivery-panel"><CardAccent icon={Truck} /><h2 className="display">Доставка<br />по Астане</h2><p>Укажите адрес и желаемую дату. Стоимость и время доставки согласуйте с флористом.</p><p>Наличие букета и возможность доставки подтверждаются в переписке.</p><Pill href={buildWhatsAppLink()} external>Уточнить доставку</Pill></article><article className="delivery-panel"><CardAccent icon={Store} /><h2 className="display">Самовывоз<br />из студии</h2><p>{siteConfig.address}.</p><OpeningHours /><Pill href={siteConfig.mapUrl} variant="outline" external>Построить маршрут</Pill></article></div><section id="faq" className="faq-layout" aria-labelledby="faq-title"><div className="faq-intro"><h2 className="display faq-heading" id="faq-title">Частые вопросы</h2></div><div className="disclosures"><FaqAccordion items={faqItems} /></div></section></div></section>; }
