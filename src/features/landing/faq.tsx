import { Container } from '@/components/ui/container';
import { FaqAccordion } from './faq-accordion';
import { faqItems } from './faq-data';
import styles from './faq.module.css';

export function Faq() {
  return <section id="faq" aria-labelledby="faq-title" className={styles.section}>
    <Container className={styles.layout}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Частые вопросы</span>
        <h2 id="faq-title">О цветах<br/>и не только</h2>
      </div>
      <FaqAccordion items={faqItems}/>
    </Container>
  </section>;
}
