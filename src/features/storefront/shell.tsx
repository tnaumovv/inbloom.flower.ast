'use client';
import Link from 'next/link';
import { CinematicFooter } from '@/components/ui/motion-footer';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './header.module.css';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { siteConfig, navItems } from '@/config/site';
import { buildWhatsAppLink, customBouquetMessage } from '@/features/contact/whatsapp';

export const navigation = navItems;
// Use native fragment navigation to avoid cached route hashes accumulating across pages.
// eslint-disable-next-line @next/next/no-html-link-for-pages
export function Brand() { return <a className="brand" href="/#home" aria-label="In Bloom — главная"><img src="/images/logo.png" width="1768" height="890" alt="In Bloom" /></a>; }
function ButtonShape({ children }: { children: ReactNode }) {
  return <><span>{children}</span><svg className="button-bridge" viewBox="0 0 36 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8C12 8 10 20 18 20S24 8 36 8V42C24 42 26 30 18 30S12 42 0 42Z" /></svg><b aria-hidden="true"><ArrowUpRight /></b></>;
}
export function Pill({ children, href, variant = '', external = false }: { children: ReactNode; href: string; variant?: string; external?: boolean }) {
  const shaped = !variant.includes('outline');
  return <Link className={`pill ${variant} ${shaped ? 'shaped' : ''}`} href={href} {...external ? { target: '_blank', rel: 'noopener noreferrer' } : {}}>{shaped ? <ButtonShape>{children}</ButtonShape> : children}</Link>;
}
export function Compound({ children, href, external = false }: { children: ReactNode; href: string; external?: boolean }) {
  return <Link className="compound" href={href} {...external ? { target: '_blank', rel: 'noopener noreferrer' } : {}}><ButtonShape>{children}</ButtonShape></Link>;
}
export function Header() {
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [compact, setCompact] = useState(false);
  const [active, setActive] = useState('/#home');
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const links = [{ href: '/#home', label: 'Главная' }, ...navigation];
  const current = path.startsWith('/catalog') ? '/catalog' : active;
  const highlighted = hovered || current;

  useEffect(() => {
    // EduBright's compact header / scroll tracking, adapted to storefront routes.
    let frame = 0;
    const update = () => {
      frame = 0;
      setCompact(window.scrollY > 36);
      if (path !== '/') return;
      let href = '/#home';
      for (const id of ['home', 'bouquets', 'studio', 'delivery', 'reviews', 'contacts']) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.42) href = id === 'bouquets' ? '/catalog' : `/#${id}`;
      }
      setActive(href);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [path]);

  return <>
    <header className={`site-header ${styles.header} ${compact ? styles.compact : ''}`} data-compact={compact}>
      <div className={styles.inner}>
        <Brand />
        <nav className={styles.nav} aria-label="Основная навигация" onMouseLeave={() => setHovered(null)}>
          {links.map(item => <a key={item.href} href={item.href === '/catalog' ? '/catalog#main' : item.href}
            aria-current={current === item.href ? path.startsWith('/catalog') ? 'page' : 'location' : undefined}
            onMouseEnter={() => setHovered(item.href)} onFocus={() => setHovered(item.href)} onBlur={() => setHovered(null)}>
            {highlighted === item.href && <motion.span className={styles.indicator} layoutId="inbloom-navigation" initial={false} transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }} aria-hidden="true" />}
            <span>{item.label}</span>
          </a>)}
        </nav>
        <Link className={styles.action} href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">WhatsApp <b aria-hidden="true"><ArrowUpRight size={17} /></b></Link>
        <button type="button" className={styles.menuButton} aria-label="Открыть меню" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => { dialog.current?.showModal(); setMenuOpen(true); }}><Menu aria-hidden="true" size={22} /></button>
      </div>
    </header>
    <div className={styles.spacer} aria-hidden="true" />
    <dialog ref={dialog} id="mobile-menu" className="menu-panel" aria-label="Меню" onClose={() => setMenuOpen(false)} onClickCapture={event => { if (event.target instanceof Element && event.target.closest('a[href]')) dialog.current?.close(); }}>
      <div className="menu-top"><Brand /><button autoFocus className="close-button" aria-label="Закрыть меню" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button></div>
      <nav className="menu-links" aria-label="Мобильная навигация">{links.map(item => <a key={item.href} href={item.href === '/catalog' ? '/catalog#main' : item.href} aria-current={current === item.href ? 'location' : undefined}>{item.label}</a>)}</nav>
      <div className="menu-bottom"><Pill href={buildWhatsAppLink()} external>Заказать в WhatsApp</Pill><Link className="text-link" href={`tel:${siteConfig.phoneE164}`}>{siteConfig.phoneDisplay}</Link><p>{siteConfig.address}</p><Link className="text-link" href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">@{siteConfig.instagramHandle} <ArrowUpRight aria-hidden="true" size={16} /></Link></div>
    </dialog>
    <noscript><details className="mobile-menu-fallback container"><summary>Разделы сайта</summary><nav>{links.map(item => <a key={item.href} href={item.href === '/catalog' ? '/catalog#main' : item.href}>{item.label}</a>)}</nav></details></noscript>
  </>;
}
// Match the header: native fragment navigation also scrolls on repeated catalogue clicks.
// eslint-disable-next-line @next/next/no-html-link-for-pages
export function Footer() { return <CinematicFooter action={<Compound href={buildWhatsAppLink()} external>Написать флористу</Compound>}><div className="footer-main"><div className="footer-brand"><img src="/images/logo.png" width="1768" height="890" alt="In Bloom" /><p>Цветочная студия<br />Букеты в Астане</p></div><div className="footer-column"><h3>Каталог</h3><a href="/catalog#main">Все букеты</a><Link href={buildWhatsAppLink(customBouquetMessage)} target="_blank" rel="noopener noreferrer">Собрать свой букет</Link></div><div className="footer-column"><h3>Покупателям</h3><Link href="/#studio">О студии</Link><Link href="/#delivery">Доставка и заказ</Link><Link href="/#reviews">Отзывы</Link><Link href="/#contacts">Контакты</Link></div><div className="footer-column"><h3>Контакты</h3><Link className="footer-phone" href={`tel:${siteConfig.phoneE164}`}>{siteConfig.phoneDisplay}</Link><Link href={siteConfig.mapUrl} target="_blank" rel="noopener noreferrer">{siteConfig.address}</Link><Link href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">@{siteConfig.instagramHandle}</Link></div></div></CinematicFooter>; }
