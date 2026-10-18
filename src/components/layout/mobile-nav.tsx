'use client';

import { useEffect, useRef } from 'react';
import { navItems } from '@/config/site';
import { Icon } from '@/components/ui/icon';

export function MobileNav({ items }: { items: typeof navItems }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const toggleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches && detailsRef.current) detailsRef.current.open = false;
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return <details className="mobile-nav" ref={detailsRef} onKeyDown={event => {
    if (event.key === 'Escape' && detailsRef.current?.open) {
      event.preventDefault();
      detailsRef.current.open = false;
      toggleRef.current?.focus();
    }
  }}>
    <summary ref={toggleRef} aria-label="Меню"><Icon name="menu"/><span className="sr-only">Меню</span></summary>
    <nav className="mobile-nav-panel" aria-label="Мобильная навигация">
      {items.map(item => <a key={item.href} href={item.href} onClick={() => {
        if (detailsRef.current) detailsRef.current.open = false;
      }}>{item.label}</a>)}
    </nav>
  </details>;
}
