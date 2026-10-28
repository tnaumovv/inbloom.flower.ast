'use client';

import { useEffect, useRef, useState } from 'react';
import { Asterisk } from 'lucide-react';

export function BrandTicker() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => setActive(visible && !document.hidden && !preference.matches);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    preference.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      preference.removeEventListener('change', update);
    };
  }, []);

  return <div ref={root} className="ticker" data-running={active} aria-hidden="true">
    <div className="ticker-track" aria-hidden="true">
      {[0, 1].map(group => <div className="ticker-group" key={group}>
        {[0, 1, 2, 3].map(item => <span key={item}>in bloom <Asterisk /></span>)}
      </div>)}
    </div>
  </div>;
}
