'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { Container } from '@/components/ui/container';
import { navItems } from '@/config/site';
import { MobileNav } from './mobile-nav';

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const lightSections = ['bouquets', 'faq'].map(id => document.getElementById(id));
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const middle = header.getBoundingClientRect().height / 2;
        header.dataset.overLight = String(lightSections.some(section => {
          const box = section?.getBoundingClientRect();
          return box && box.top <= middle && box.bottom > middle;
        }));
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return <header ref={headerRef} className="site-header">
    <Container className="header-content">
      <a className="brand-link" href="#" aria-label="In Bloom — на главную"><Image src="/images/logo.png" alt="In Bloom" width={148} height={104} className="brand-image" /></a>
      <nav className="desktop-nav" aria-label="Основная навигация">{navItems.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
      <div className="header-actions"><MobileNav items={navItems}/></div>
    </Container>
  </header>;
}
