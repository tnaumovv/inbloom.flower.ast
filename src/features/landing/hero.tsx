import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { LinkButton } from '@/components/ui/link-button';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';
import { HeroScene } from './hero-scene';
import styles from './hero.module.css';

export function Hero() {
  return <section className={styles.hero} aria-labelledby="hero-title">
    <HeroScene/>
    <Container className={styles.content}>
      <div className={styles.copy}><span className={styles.eyebrow}>IN BLOOM · ЦВЕТОЧНАЯ СТУДИЯ</span><h1 id="hero-title">Цветы <span>в Астане</span></h1>
      <p>Для важных слов. Для нежных чувств. Для вас.</p></div>
      <div className={styles.actions}><LinkButton href="#bouquets" className={styles.chooseButton}><span>Выбрать букет</span><Icon name="arrow-right"/></LinkButton><LinkButton href={buildWhatsAppLink()} variant="outline" external className={styles.floristButton}><span>Написать флористу</span><Icon name="whatsapp"/></LinkButton></div>
      <div className={styles.signature}><span>Букеты с характером</span><span>Индивидуальные композиции</span><span>Астана</span></div>
    </Container>
  </section>;
}
