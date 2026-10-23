import { HeroScene } from './hero-scene';
import styles from './hero.module.css';

export function Hero() {
  return <section className={styles.hero} aria-labelledby="hero-title">
    <HeroScene/>
    <div className={styles.content}>
      <div className={styles.copy}><h1 id="hero-title">Нежность <span>в каждом</span> <span>лепестке</span></h1>
      <p>Для важных слов. Для нежных чувств. Для вас.</p></div>
      <div className={styles.signature}><span>Букеты с характером</span><span>Индивидуальные композиции</span><span>Астана</span></div>
    </div>
  </section>;
}
