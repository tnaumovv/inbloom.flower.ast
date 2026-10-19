'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { navItems } from '@/config/site';
import { MobileNav } from './mobile-nav';
import { Brand } from './brand';
import { InteractiveHoverLink } from '@/components/ui/interactive-hover-link';

export function SiteHeader() {
  const [active, setActive] = useState<string>('');
  const [hovered, setHovered] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setCompact(window.scrollY > 32);
        const current = navItems.filter(item => {
          const section = document.querySelector(item.href);
          return section && section.getBoundingClientRect().top <= window.innerHeight * .4;
        }).at(-1);
        setActive(current?.href ?? '');
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  return <header className="site-header" data-compact={compact}>
    <div className="header-content">
      <Brand/>
      <nav className="desktop-nav" aria-label="Основная навигация" onMouseLeave={() => setHovered(null)}>
        {navItems.map(item => <a key={item.href} href={item.href} aria-current={active === item.href ? 'location' : undefined} onMouseEnter={() => setHovered(item.href)} onFocus={() => setHovered(item.href)} onBlur={() => setHovered(null)}>
          {(hovered ?? active) === item.href && <motion.span className="nav-indicator" layoutId="header-navigation" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }} aria-hidden="true"/>}
          <span className="nav-label">{item.label}</span>
        </a>)}
      </nav>
      <div className="header-actions"><InteractiveHoverLink className="header-order" href="#bouquets">За букетом</InteractiveHoverLink><MobileNav items={navItems}/></div>
    </div>
  </header>;
}
