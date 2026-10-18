import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { LinkButton } from '@/components/ui/link-button';
import { navItems } from '@/config/site';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';
import { MobileNav } from './mobile-nav';

export function SiteHeader() {
  return <header className="site-header">
    <Container className="header-content">
      <a className="brand-link" href="#" aria-label="In Bloom — на главную"><Image src="/images/logo.png" alt="In Bloom" width={148} height={104} className="brand-image" /></a>
      <nav className="desktop-nav" aria-label="Основная навигация">
        {navItems.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
      </nav>
      <div className="header-actions"><LinkButton href={buildWhatsAppLink()} variant="outline" external className="header-whatsapp"><Icon name="whatsapp"/><span>WhatsApp</span></LinkButton><MobileNav items={navItems}/></div>
    </Container>
  </header>;
}
