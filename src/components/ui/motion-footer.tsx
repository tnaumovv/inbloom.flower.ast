'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp, Asterisk } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './motion-footer.module.css';

/** Adapted from the supplied CinematicFooter: real In Bloom content and tokens. */
export function CinematicFooter({ children, action }: { children: ReactNode; action: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(element.querySelector('[data-footer-wordmark]'), { y: () => window.innerHeight * 0.1, scale: 0.86, opacity: 0.05 }, {
        y: 0, scale: 1, opacity: 0.4, ease: 'none', scrollTrigger: { trigger: element, start: 'top 80%', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
      });
      gsap.fromTo(element.querySelectorAll('[data-footer-reveal]'), {
        y: 48, opacity: 0.2,
      }, {
        y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: element, start: 'top 85%', once: true },
      });
    }, element);
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const cleanups = [...element.querySelectorAll<HTMLElement>('[data-magnetic]')].map(target => {
        const xTo = gsap.quickTo(target, 'x', { duration: 0.35, ease: 'power2.out' });
        const yTo = gsap.quickTo(target, 'y', { duration: 0.35, ease: 'power2.out' });
        const move = (event: PointerEvent) => {
          const rect = target.getBoundingClientRect();
          xTo(gsap.utils.clamp(-8, 8, (event.clientX - rect.left - rect.width / 2) * 0.12));
          yTo(gsap.utils.clamp(-6, 6, (event.clientY - rect.top - rect.height / 2) * 0.12));
        };
        const reset = () => { xTo(0); yTo(0); };
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerleave', reset);
        target.addEventListener('focusin', reset);
        return () => {
          target.removeEventListener('pointermove', move);
          target.removeEventListener('pointerleave', reset);
          target.removeEventListener('focusin', reset);
        };
      });
      return () => cleanups.forEach(cleanup => cleanup());
    }, element);
    const observer = new IntersectionObserver(([entry]) => {
      element.dataset.inView = String(entry.isIntersecting);
    });
    const visibility = () => { element.dataset.hidden = String(document.hidden); };
    visibility();
    observer.observe(element);
    document.addEventListener('visibilitychange', visibility);
    const resize = new ResizeObserver(() => ScrollTrigger.refresh());
    const content = document.querySelector('.route-content');
    if (content) resize.observe(content);
    return () => {
      media.revert(); observer.disconnect(); resize.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [pathname]);

  return <div ref={root} className={styles.frame}>
    <footer className={styles.footer} aria-label="Контакты и разделы In Bloom">
      <div className={styles.ribbon} aria-hidden="true"><div className={styles.track}>
        {[0, 1].map(copy => <div className={styles.ribbonGroup} key={copy}>
          {['In Bloom', 'Цветы и чувства', 'Букет по вашему желанию', 'С любовью к цветам'].map(text => <span key={text}>{text}<Asterisk size={18} /></span>)}
        </div>)}
      </div></div>
      <div className={styles.invitation} data-footer-reveal>
        <h2 className="display">Пусть чувства<br />расцветают</h2>
        <div className={styles.action} data-magnetic>{action}</div>
      </div>
      <div className={`container ${styles.links}`} data-footer-reveal>{children}</div>
      <div className={`container ${styles.bottom}`}>
        <span>In Bloom · Астана</span>
        <button type="button" className={styles.backTop} data-magnetic aria-label="Вернуться наверх" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>
          <ArrowUp aria-hidden="true" size={22} />
        </button>
      </div>
      <div className={styles.wordmark} data-footer-wordmark aria-hidden="true">in bloom</div>
    </footer>
  </div>;
}
