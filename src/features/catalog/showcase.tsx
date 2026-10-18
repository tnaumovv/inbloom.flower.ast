'use client';

import { BotanicalEdge } from '@/components/ui/botanical-edge';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { siteConfig } from '@/config/site';
import { BouquetCard } from './bouquet-card';
import { formatPriceKzt } from './format-price';
import { useBouquetCarousel } from './use-bouquet-carousel';
import type { Bouquet } from './types';
import styles from './showcase.module.css';

export function Showcase({ bouquets }: { bouquets: readonly Bouquet[] }) {
  const { viewportRef, ready, selected: selectedIndex, playing, paused, togglePause, navigate, onPointerDown, onPointerEnter, onPointerLeave, onFocus, onBlur } = useBouquetCarousel();
  const selected = bouquets[selectedIndex];

  return <section id="bouquets" className={styles.showcase} aria-labelledby="showcase-title" onPointerDownCapture={onPointerDown} onFocusCapture={onFocus} onBlurCapture={onBlur}>
    <BotanicalEdge tone="cream" placement="top"/>
    <Container className={styles.heading}><div data-reveal><h2 id="showcase-title">Витрина букетов</h2><p>Выберите букет — детали обсудим в WhatsApp.</p></div></Container>
    <div data-reveal ref={viewportRef} data-enhanced={ready || undefined} className={styles.viewport} role="region" aria-roledescription="карусель" aria-label="Лента букетов" tabIndex={0} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      const targets: Record<string, 'next' | 'previous' | number> = { ArrowLeft: 'previous', ArrowRight: 'next', Home: 0, End: bouquets.length - 1 };
      if (event.key in targets) { event.preventDefault(); navigate(targets[event.key]); }
    }}>
      <div className={styles.track}>{bouquets.map((bouquet, index) => <div key={bouquet.id} className={styles.slide} data-bouquet-card data-bouquet-index={index}><BouquetCard bouquet={bouquet}/></div>)}</div>
    </div>
    {ready && bouquets.length > 1 && <div className={styles.controls}>
      <button type="button" aria-label="Предыдущий букет" onClick={() => navigate('previous')}><Icon name="arrow-left"/></button>
      <button data-motion-toggle className={styles.motionToggle} type="button" aria-label={paused ? 'Продолжить движение букетов' : 'Приостановить движение букетов'} aria-pressed={paused} onClick={togglePause}><Icon name={paused ? 'play' : 'pause'}/></button>
      <button type="button" aria-label="Следующий букет" onClick={() => navigate('next')}><Icon name="arrow-right"/></button>
    </div>}
    <p className="sr-only" role="status" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">{selected && `${selectedIndex + 1} из ${bouquets.length}. ${selected.name}, ${formatPriceKzt(selected.priceKzt)}.`}</p>
    <a className={styles.catalogueLink} href={siteConfig.catalogueUrl} target="_blank" rel="noopener noreferrer">Больше букетов <Icon name="arrow-up-right"/></a>
  </section>;
}
