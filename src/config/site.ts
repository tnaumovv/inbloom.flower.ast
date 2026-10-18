export const siteConfig = {
  name: 'In Bloom',
  phoneDisplay: '+7 708 220 46 75',
  phoneE164: '+77082204675',
  whatsappNumber: '77082204675',
  address: 'Астана, проспект Женис, 8/1',
  catalogueUrl: 'https://app.florax.kz/ru/in_bloom/bouquets',
  mapUrl: 'https://2gis.kz/astana/firm/70000001105801781',
  instagramUrl: 'https://www.instagram.com/inbloom.flower.ast/',
  instagramHandle: 'inbloom.flower.ast',
} as const;

export const navItems = [
  { label: 'Букеты', href: '#bouquets' },
  { label: 'О студии', href: '#studio' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Контакты', href: '#contacts' },
] as const;
