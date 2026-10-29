'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp, Asterisk } from 'lucide-react';
import styles from './motion-footer.module.css';

/** Adapted from the supplied CinematicFooter: real In Bloom content and tokens. */
export function CinematicFooter({ children, action }: { children: ReactNode; action: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const desktop = window.matchMedia('(min-width: 701px) and (prefers-reduced-motion: no-preference)');
    let disposed = false;
    let nearby = false;
    let loading = false;
    let release: (() => void) | undefined;
    const prepareMotion = async () => {
      if (disposed || loading || release || !desktop.matches) return;
      loading = true;
      try {
        const { mountFooterMotion } = await import('./footer-motion');
        if (!disposed && desktop.matches) release = mountFooterMotion(element);
      } catch { /* Footer links remain usable if the optional animation chunk fails. */ }
      finally { loading = false; }
    };
    const preference = () => {
      if (!desktop.matches) { release?.(); release = undefined; }
      else if (nearby) void prepareMotion();
    };
    const observer = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      element.dataset.inView = String(nearby);
      if (nearby) void prepareMotion();
    }, { rootMargin: '200px' });
    const visibility = () => { element.dataset.hidden = String(document.hidden); };
    visibility();
    observer.observe(element);
    desktop.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true;
      release?.(); observer.disconnect();
      desktop.removeEventListener('change', preference);
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
