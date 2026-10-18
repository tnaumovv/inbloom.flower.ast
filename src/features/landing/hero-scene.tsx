'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties } from 'react';
import styles from './hero.module.css';

const petals = Array.from({ length: 14 }, (_, index) => ({
  left: `${52 + (index * 13) % 47}%`,
  size: `${14 + (index * 7) % 21}px`,
  duration: `${14 + (index * 3) % 11}s`,
  delay: `${-index * 2.7}s`,
  drift: `${index % 2 ? -70 : 90}px`,
}));

export function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const bouquetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const bouquet = bouquetRef.current;
    const hero = scene?.closest('section');
    if (!scene || !bouquet || !hero) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      bouquet.style.removeProperty('--tilt-x');
      bouquet.style.removeProperty('--tilt-y');
      bouquet.style.removeProperty('--shift-x');
    };
    const move = (event: PointerEvent) => {
      if (motion.matches || !pointer.matches) return;
      const { clientX, clientY } = event;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = Math.max(-.5, Math.min(.5, (clientX - bounds.left) / bounds.width - .5));
        const y = Math.max(-.5, Math.min(.5, (clientY - bounds.top) / bounds.height - .5));
        bouquet.style.setProperty('--tilt-x', `${-y * 8}deg`);
        bouquet.style.setProperty('--tilt-y', `${x * 10}deg`);
        bouquet.style.setProperty('--shift-x', `${x * 14}px`);
      });
    };
    const visibility = new IntersectionObserver(([entry]) => {
      scene.dataset.paused = String(!entry.isIntersecting);
      if (!entry.isIntersecting) reset();
    });
    visibility.observe(hero);
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', reset);
    motion.addEventListener('change', reset);
    pointer.addEventListener('change', reset);
    return () => {
      reset();
      visibility.disconnect();
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', reset);
      motion.removeEventListener('change', reset);
      pointer.removeEventListener('change', reset);
    };
  }, []);

  return <div ref={sceneRef} className={styles.art} aria-hidden="true" data-hero-scene>
    <div className={styles.petals}>{petals.map((petal, index) => <span key={index} className={styles.petal} style={{
      '--left': petal.left, '--size': petal.size, '--duration': petal.duration,
      '--delay': petal.delay, '--drift': petal.drift,
    } as CSSProperties}><i/></span>)}</div>
    <div className={styles.groundShadow}/>
    <div ref={bouquetRef} className={styles.bouquetParallax} data-hero-bouquet>
      <div className={styles.bouquetFloat}><Image src="/images/bouquets/soft-s.png" alt="" fill sizes="(max-width: 600px) 115vw, (max-width: 1023px) 75vw, 65vw" preload className={styles.image}/></div>
    </div>
  </div>;
}
