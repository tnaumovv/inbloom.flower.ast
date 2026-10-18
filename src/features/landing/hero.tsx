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
      <h1 id="hero-title">Цветы <span>в Астане</span></h1>
      <p>Композиции и букеты под ваши пожелания.</p>
      <div className={styles.actions}><LinkButton href="#bouquets" className={styles.chooseButton}><span>Выбрать букет</span><Icon name="arrow-right"/></LinkButton><LinkButton href={buildWhatsAppLink()} variant="outline" external className={styles.floristButton}><span>Написать флористу</span><Icon name="whatsapp"/></LinkButton></div>
    </Container>
  </section>;
}
