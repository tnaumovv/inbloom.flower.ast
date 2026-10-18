import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return <footer id="contacts" className="site-footer"><Container><div className="footer-layout">
    <a href="#" className="footer-brand" aria-label="In Bloom — на главную"><Image src="/images/logo.png" alt="In Bloom" width={230} height={170}/></a>
    <div className="footer-location"><h2>Заходите за цветами</h2><p><Icon name="pin"/><span>{siteConfig.address}</span></p><div className="delivery-note"><Icon name="truck"/><div><p>Доставка по Астане</p><p className="delivery-detail">Стоимость и время уточняйте в WhatsApp.</p></div></div></div>
    <div className="footer-links"><a href={`tel:${siteConfig.phoneE164}`}><Icon name="whatsapp"/><span>{siteConfig.phoneDisplay}</span></a><a href={siteConfig.mapUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin"/><span>Открыть в 2ГИС <span aria-hidden="true">↗</span></span></a><a href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer"><Icon name="instagram"/><span>Instagram <span aria-hidden="true">↗</span></span></a><a className="instagram-handle" href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">{siteConfig.instagramHandle}</a></div>
  </div></Container></footer>;
}
