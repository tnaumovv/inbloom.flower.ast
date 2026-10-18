import Image from 'next/image';
import { BotanicalEdge } from '@/components/ui/botanical-edge';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { LinkButton } from '@/components/ui/link-button';
import { buildWhatsAppLink, customBouquetMessage } from '@/features/contact/whatsapp';

export function CustomBouquet() {
  return <section id="studio" className="custom-bouquet" aria-labelledby="custom-title">
    <BotanicalEdge tone="olive" placement="top"/>
    <Container className="custom-layout">
      <div className="custom-copy"><h2 id="custom-title">Не нашли<br/> свой букет?</h2><p>Расскажите о поводе и пожеланиях — обсудим композицию в WhatsApp.</p><LinkButton href={buildWhatsAppLink(customBouquetMessage)} external>Обсудить букет <Icon name="whatsapp"/></LinkButton></div>
      <div className="custom-art" aria-hidden="true"><Image src="/images/contact-flower.png" alt="" fill sizes="(min-width: 1024px) 45vw, (min-width: 600px) 50vw, 90vw" /></div>
    </Container>
  </section>;
}
