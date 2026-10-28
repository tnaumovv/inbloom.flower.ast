import { siteConfig } from '@/config/site';
import { Featured } from '@/features/catalog/catalog-view';
import { FaqAccordion } from '@/features/landing/faq-accordion';
import { faqItems } from '@/features/landing/faq-data';
import { Hero, TitleRow, CustomSection, AboutSection, ContactsSection, OpeningHours } from './sections';
import { Pill } from './shell';
import { ReviewsSection } from './reviews';

export function HomePage() {
  return <main id="main">
    <Hero />
    <section className="container" id="bouquets">
      <TitleRow title="Букеты" action={false} />
      <Featured />
      <div className="more-row"><Pill href="/catalog" variant="outline">Все букеты</Pill></div>
    </section>
    <CustomSection />
    <section className="container section">
      <TitleRow title="Другие букеты" action={false} />
      <Featured secondary />
      <div className="more-row"><Pill href="/catalog" variant="outline">Все букеты</Pill></div>
    </section>
    <AboutSection />
    <DeliverySection />
    <ReviewsSection />
    <ContactsSection />
  </main>;
}

function DeliverySection() {
  return <section className="container section" id="delivery">
    <TitleRow title="Доставка и самовывоз" action={false} />
    <div className="delivery-options">
      <div className="delivery-panels">
        <article className="delivery-panel">
          <h3 className="display">По Астане</h3>
          <p>Адрес и дату доставки укажите при заказе.</p>
          <Pill href="/catalog">Выбрать букет</Pill>
        </article>
        <article className="delivery-panel">
          <h3 className="display">Из студии</h3>
          <p>{siteConfig.address}</p>
          <OpeningHours />
          <Pill href={siteConfig.mapUrl} variant="outline" external>Построить маршрут</Pill>
        </article>
      </div>
      <section id="faq" className="faq-layout" aria-labelledby="faq-title">
        <div className="faq-intro"><h2 className="display faq-heading" id="faq-title">Частые вопросы</h2></div>
        <div className="disclosures"><FaqAccordion items={faqItems} /></div>
      </section>
    </div>
  </section>;
}
