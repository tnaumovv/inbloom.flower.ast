import Image from 'next/image';
import { Container } from '@/components/ui/container';

export function CustomBouquet() {
  return <section id="studio" className="custom-bouquet" aria-labelledby="custom-title">
    <Container className="custom-layout">
      <div className="custom-copy" data-reveal><h2 id="custom-title">Не нашли<br/> свой букет?</h2><p>Расскажите о поводе и пожеланиях — обсудим композицию в WhatsApp.</p></div>
      <div className="custom-art" aria-hidden="true" data-reveal data-reveal-delay><Image src="/images/contact-flower.png" alt="" fill sizes="(min-width: 1024px) 45vw, (min-width: 600px) 50vw, 90vw" /></div>
    </Container>
  </section>;
}
