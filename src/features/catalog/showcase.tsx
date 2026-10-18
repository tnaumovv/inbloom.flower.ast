'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BotanicalEdge } from '@/components/ui/botanical-edge';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { siteConfig } from '@/config/site';
import { BouquetCard } from './bouquet-card';
import { formatPriceKzt } from './format-price';
import type { Bouquet } from './types';
import styles from './showcase.module.css';

export function Showcase({ bouquets }: { bouquets: readonly Bouquet[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const targetRef = useRef(0);
  const scrollableRef = useRef(false);
  const [active, setActive] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const goTo = useCallback((index: number, animate = true) => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.scrollWidth <= viewport.clientWidth + 2 || !bouquets.length) return;
    scrollableRef.current = true;
    const bounded = Math.max(0, Math.min(bouquets.length - 1, index));
    targetRef.current = bounded;
    const card = viewport.querySelectorAll<HTMLElement>('[data-bouquet-card]')[bounded];
    if (!card) return;
    const box = card.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollTo({ left: viewport.scrollLeft + box.left + box.width / 2 - bounds.left - bounds.width / 2, behavior: animate && !reduced ? 'smooth' : 'instant' });
  }, [bouquets.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !bouquets.length) return;
    let frame = 0;
    let resizeFrame = 0;
    let announceTimer: ReturnType<typeof setTimeout>;

    const updateActive = () => {
      if (!scrollableRef.current) return;
      const center = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      viewport.querySelectorAll<HTMLElement>('[data-bouquet-card]').forEach((card, index) => {
        const box = card.getBoundingClientRect();
        const delta = Math.abs(box.left + box.width / 2 - center);
        if (delta < distance) { distance = delta; nearest = index; }
      });
      activeRef.current = nearest;
      setActive(nearest);
    };
    const announce = () => {
      updateActive();
      targetRef.current = activeRef.current;
      const b = bouquets[activeRef.current];
      if (b) setAnnouncement(`${activeRef.current + 1} из ${bouquets.length}. ${b.name}, ${formatPriceKzt(b.priceKzt)}.`);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActive);
      clearTimeout(announceTimer);
      announceTimer = setTimeout(announce, 160);
    };
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const scrollable = viewport.scrollWidth > viewport.clientWidth + 2;
        scrollableRef.current = scrollable;
        setCanScroll(scrollable);
        if (scrollable) { goTo(targetRef.current, false); announce(); }
      });
    });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => goTo(targetRef.current, false);
    resize.observe(viewport);
    viewport.addEventListener('scroll', onScroll, { passive: true });
    motion.addEventListener('change', onMotionChange);
    return () => {
      resize.disconnect();
      viewport.removeEventListener('scroll', onScroll);
      motion.removeEventListener('change', onMotionChange);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      clearTimeout(announceTimer);
    };
  }, [bouquets, goTo]);

  return <section id="bouquets" className={styles.showcase} aria-labelledby="showcase-title">
    <BotanicalEdge tone="cream" placement="top"/>
    <Container className={styles.heading}><h2 id="showcase-title">Витрина букетов</h2><p>Выберите букет — детали обсудим в WhatsApp.</p></Container>
    <div ref={viewportRef} className={styles.viewport} role="region" aria-label="Лента букетов" tabIndex={0} onKeyDown={event => {
      if (event.target !== event.currentTarget || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth + 2) return;
      const targets: Record<string, number> = { ArrowLeft: targetRef.current - 1, ArrowRight: targetRef.current + 1, Home: 0, End: bouquets.length - 1 };
      if (event.key in targets) { event.preventDefault(); goTo(targets[event.key]); }
    }} onFocusCapture={event => {
      const target = event.target as HTMLElement;
      const card = target.closest<HTMLElement>('[data-bouquet-index]');
      if (card) goTo(Number(card.dataset.bouquetIndex));
    }}>
      <div className={styles.track}>{bouquets.map((bouquet, index) => <div key={bouquet.id} className={styles.slide} data-bouquet-card data-bouquet-index={index} data-active={active === index}><BouquetCard bouquet={bouquet}/></div>)}</div>
    </div>
    {canScroll && <div className={styles.controls}>
      <button type="button" aria-label="Предыдущий букет" onClick={() => goTo(activeRef.current - 1)} disabled={active === 0}><Icon name="arrow-left"/></button>
      <span aria-hidden="true">{String(active + 1).padStart(2, '0')} <span className={styles.divider}>/</span> {String(bouquets.length).padStart(2, '0')}</span>
      <button type="button" aria-label="Следующий букет" onClick={() => goTo(activeRef.current + 1)} disabled={active === bouquets.length - 1}><Icon name="arrow-right"/></button>
    </div>}
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    <a className={styles.catalogueLink} href={siteConfig.catalogueUrl} target="_blank" rel="noopener noreferrer">Больше букетов <Icon name="arrow-up-right"/></a>
  </section>;
}
