import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { LinkButton } from '@/components/ui/link-button';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';
import styles from './hero.module.css';

export function Hero() {
  return <section className={styles.hero} aria-labelledby="hero-title">
    <div className={styles.art} aria-hidden="true"><Image src="/images/hero.png" alt="" fill sizes="100vw" preload className={styles.image}/></div>
    <Container className={styles.content}>
      <h1 id="hero-title">Цветы <span>в Астане</span></h1>
      <p>Композиции и букеты под ваши пожелания.</p>
      <div className={styles.actions}><LinkButton href="#bouquets">Выбрать букет</LinkButton><LinkButton href={buildWhatsAppLink()} variant="outline" external>Написать флористу</LinkButton></div>
    </Container>
  </section>;
}
