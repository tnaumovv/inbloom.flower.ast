import { Icon } from '@/components/ui/icon';
import { buildWhatsAppLink } from './whatsapp';

export function FloatingWhatsApp() {
  return <a className="floating-whatsapp" href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer" aria-label="Написать в WhatsApp">
    <Icon name="whatsapp"/><span>WhatsApp</span>
  </a>;
}
