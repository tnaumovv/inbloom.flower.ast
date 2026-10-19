import Image from 'next/image';

export function Brand({ footer = false }: { footer?: boolean }) {
  return <a className={footer ? 'footer-brand' : 'brand-link'} href="#" aria-label="In Bloom — на главную">
    <Image src="/images/logo.png" alt="In Bloom" width={1785} height={892} sizes={footer ? '160px' : '112px'} className="brand-image" loading="eager"/>
  </a>;
}
