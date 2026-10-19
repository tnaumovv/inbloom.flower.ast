'use client';

import { Container } from '@/components/ui/container';
import { navItems } from '@/config/site';
import { MobileNav } from './mobile-nav';

export function SiteHeader() {

  return <header className="site-header">
    <Container className="header-content">
      <a className="brand-link" href="#" aria-label="In Bloom — на главную"><span className="brand-wordmark">in bloom<span>FLOWER STUDIO</span></span></a>
      <nav className="desktop-nav" aria-label="Основная навигация">{navItems.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
      <div className="header-actions"><MobileNav items={navItems}/></div>
    </Container>
  </header>;
}
