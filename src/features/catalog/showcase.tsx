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
  const [active, setActive] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);
  const [canScroll, setCanScroll] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const getLayout = useCallback((viewport: HTMLDivElement) => {
    const visible = Math.min(bouquets.length, Number(getComputedStyle(viewport).getPropertyValue('--visible-cards')) || 1);
    const track = viewport.firstElementChild;
    const padding = track ? parseFloat(getComputedStyle(track).paddingLeft) : 0;
    return { visible, padding, maxIndex: Math.max(0, bouquets.length - visible) };
  }, [bouquets.length]);

  const goTo = useCallback((index: number, animate = true) => {
    const viewport = viewportRef.current;
    if (!viewport || !bouquets.length) return;
    const { maxIndex, padding } = getLayout(viewport);
    const bounded = Math.max(0, Math.min(maxIndex, index));
    targetRef.current = bounded;
    const card = viewport.querySelectorAll<HTMLElement>('[data-bouquet-card]')[bounded];
    if (!card) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollTo({ left: viewport.scrollLeft + card.getBoundingClientRect().left - viewport.getBoundingClientRect().left - padding, behavior: animate && !reduced ? 'smooth' : 'instant' });
  }, [bouquets.length, getLayout]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !bouquets.length) return;
    let frame = 0;
    let resizeFrame = 0;
    let announceTimer: ReturnType<typeof setTimeout>;
    const updateActive = () => {
      const { padding, maxIndex } = getLayout(viewport);
      const anchor = viewport.getBoundingClientRect().left + padding;
      let nearest = 0;
      let distance = Infinity;
      viewport.querySelectorAll<HTMLElement>('[data-bouquet-card]').forEach((card, index) => {
        const delta = Math.abs(card.getBoundingClientRect().left - anchor);
        if (delta < distance) { distance = delta; nearest = index; }
      });
      activeRef.current = Math.min(nearest, maxIndex);
      setActive(activeRef.current);
    };
    const announce = () => {
      updateActive();
      targetRef.current = activeRef.current;
      const { visible } = getLayout(viewport);
      const bouquet = bouquets[activeRef.current];
      setAnnouncement(visible === 1 && bouquet
        ? `${activeRef.current + 1} из ${bouquets.length}. ${bouquet.name}, ${formatPriceKzt(bouquet.priceKzt)}.`
        : `Букеты ${activeRef.current + 1}–${Math.min(activeRef.current + visible, bouquets.length)} из ${bouquets.length}.`);
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
        setVisibleCount(getLayout(viewport).visible);
        setCanScroll(viewport.scrollWidth > viewport.clientWidth + 2);
        goTo(targetRef.current, false);
        announce();
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
  }, [bouquets, getLayout, goTo]);

  const maxIndex = Math.max(0, bouquets.length - visibleCount);

  return <section id="bouquets" className={styles.showcase} aria-labelledby="showcase-title">
    <BotanicalEdge tone="cream" placement="top"/>
    <Container className={styles.heading}><div data-reveal><h2 id="showcase-title">Витрина букетов</h2><p>Выберите букет — детали обсудим в WhatsApp.</p></div></Container>
    <div data-reveal ref={viewportRef} className={styles.viewport} role="region" aria-roledescription="карусель" aria-label="Лента букетов" tabIndex={0} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      const targets: Record<string, number> = { ArrowLeft: targetRef.current - 1, ArrowRight: targetRef.current + 1, Home: 0, End: bouquets.length - 1 };
      if (event.key in targets) { event.preventDefault(); goTo(targets[event.key]); }
    }} onFocusCapture={event => {
      const card = (event.target as HTMLElement).closest<HTMLElement>('[data-bouquet-index]');
      const viewport = viewportRef.current;
      if (!card || !viewport) return;
      const bounds = viewport.getBoundingClientRect();
      const box = card.getBoundingClientRect();
      if (box.left < bounds.left || box.right > bounds.right) goTo(Number(card.dataset.bouquetIndex));
    }}>
      <div className={styles.track}>{bouquets.map((bouquet, index) => <div key={bouquet.id} className={styles.slide} data-bouquet-card data-bouquet-index={index}><BouquetCard bouquet={bouquet}/></div>)}</div>
    </div>
    {canScroll && <div className={styles.controls}>
      <button type="button" aria-label="Предыдущий букет" onClick={() => goTo(targetRef.current - 1)} disabled={active === 0}><Icon name="arrow-left"/></button>
      <button type="button" aria-label="Следующий букет" onClick={() => goTo(targetRef.current + 1)} disabled={active >= maxIndex}><Icon name="arrow-right"/></button>
    </div>}
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    <a className={styles.catalogueLink} href={siteConfig.catalogueUrl} target="_blank" rel="noopener noreferrer">Больше букетов <Icon name="arrow-up-right"/></a>
  </section>;
}
