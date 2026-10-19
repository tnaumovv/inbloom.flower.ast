import { Brand } from './brand';
import { ShineBorder } from '@/components/ui/shine-border';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { LinkButton } from '@/components/ui/link-button';
import { siteConfig } from '@/config/site';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';

export function SiteFooter() {
  return <footer id="contacts" className="site-footer" aria-labelledby="contacts-title"><Container>
    <div className="footer-layout">
      <div className="footer-copy" data-reveal>
        <span className="footer-eyebrow">Будем рады встрече</span>
        <h2 id="contacts-title">Заходите<br/>за цветами</h2>
        <div className="footer-contact-data">
          <address><Icon name="pin"/><span>{siteConfig.address}</span></address>
          <a className="footer-phone" href={`tel:${siteConfig.phoneE164}`}><Icon name="phone"/><span>{siteConfig.phoneDisplay}</span></a>
        </div>
        <div className="delivery-note"><Icon name="truck"/><div><p>Доставка по Астане</p><p className="delivery-detail">Стоимость и время уточняйте в WhatsApp.</p></div></div>
        <div className="footer-actions">
          <LinkButton href={buildWhatsAppLink()} external className="footer-social footer-social--whatsapp"><Icon name="whatsapp"/><span className="footer-social-copy"><span>WhatsApp</span><small>Написать флористу</small></span><Icon name="arrow-up-right"/></LinkButton>
          <LinkButton href={siteConfig.instagramUrl} external variant="outline" className="footer-social footer-social--instagram"><Icon name="instagram"/><span className="footer-social-copy"><span>Instagram</span><small>@{siteConfig.instagramHandle}</small></span><Icon name="arrow-up-right"/></LinkButton>
        </div>
      </div>
      <figure className="footer-map" data-reveal data-reveal-delay><ShineBorder/>
        <iframe title="Магазин In Bloom на карте 2ГИС" src={siteConfig.mapEmbedUrl} loading="eager" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
        <figcaption><span>In Bloom на карте</span><a href={siteConfig.mapUrl} target="_blank" rel="noopener noreferrer">Открыть в 2ГИС <Icon name="arrow-up-right"/></a></figcaption>
      </figure>
    </div>
    <div className="footer-bottom"><Brand footer/><span>In Bloom · Цветы в Астане</span></div>
  </Container></footer>;
}
