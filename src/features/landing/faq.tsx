import { Container } from '@/components/ui/container';
import { LinkButton } from '@/components/ui/link-button';
import { Icon } from '@/components/ui/icon';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';
import { FaqAccordion } from './faq-accordion';
import { faqItems } from './faq-data';
import styles from './faq.module.css';

export function Faq() {
  return <section id="faq" aria-labelledby="faq-title" className={styles.section}>
    <Container className={styles.layout}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Частые вопросы</span>
        <h2 id="faq-title">О цветах<br/>и не только</h2>
        <p>Чтобы выбрать букет<br/>было чуть проще.</p>
        <LinkButton href={buildWhatsAppLink('Здравствуйте! Подскажите, пожалуйста, по заказу букета.')} external className={styles.contact}>Задать свой вопрос <Icon name="whatsapp"/></LinkButton>
      </div>
      <FaqAccordion items={faqItems}/>
    </Container>
  </section>;
}
