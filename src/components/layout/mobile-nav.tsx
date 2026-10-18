'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FocusEvent } from 'react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { motion, useReducedMotion } from 'framer-motion';
import { navItems } from '@/config/site';
import { Icon } from '@/components/ui/icon';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function MobileNav({ items }: { items: typeof navItems }) {
  const hydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<{ top: number; height: number; glide: boolean } | null>(null);
  const pointer = useRef(false);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  const onMenuFocus = (event: FocusEvent<HTMLDivElement>) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[role="menuitem"]');
    if (!item) { setHighlight(null); return; }
    setHighlight(current => ({ top: item.offsetTop, height: item.offsetHeight, glide: pointer.current && current !== null }));
  };

  if (!hydrated) return <details className="mobile-nav mobile-nav-fallback">
    <summary aria-label="Меню"><Icon name="menu"/><span className="sr-only">Меню</span></summary>
    <nav className="mobile-nav-panel" aria-label="Мобильная навигация">{items.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
  </details>;

  return <div className="mobile-nav"><Dropdown.Root modal={false} open={open} onOpenChange={value => { setOpen(value); setHighlight(null); }}>
    <Dropdown.Trigger className="mobile-nav-trigger" aria-label="Меню"><Icon name={open ? 'close' : 'menu'}/></Dropdown.Trigger>
    <Dropdown.Portal><Dropdown.Content className="mobile-nav-panel" aria-label="Разделы сайта" align="end" sideOffset={14} collisionPadding={24} loop onFocus={onMenuFocus} onPointerMoveCapture={() => { pointer.current = true; }} onKeyDownCapture={() => { pointer.current = false; }}>
      <motion.span className="mobile-nav-highlight" aria-hidden="true" initial={false} animate={highlight ? { y: highlight.top, height: highlight.height, opacity: 1 } : { opacity: 0 }} transition={highlight?.glide && !reduced ? { type: 'spring', stiffness: 500, damping: 35 } : { duration: 0 }}/>
      <nav aria-label="Мобильная навигация">{items.map((item, index) => <Dropdown.Item asChild key={item.href} style={{ '--item-index': index } as CSSProperties}><a href={item.href} className="mobile-nav-item">{item.label}</a></Dropdown.Item>)}</nav>
    </Dropdown.Content></Dropdown.Portal>
  </Dropdown.Root></div>;
}
