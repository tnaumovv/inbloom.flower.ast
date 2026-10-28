const mapWidgetOptions = {
  pos: { lat: 51.164454, lon: 71.414802, zoom: 17 },
  opt: { city: 'astana' },
  org: '70000001105801781',
};

export const siteConfig = {
  name: 'In Bloom',
  phoneDisplay: '+7 708 220 46 75',
  phoneE164: '+77082204675',
  whatsappNumber: '77082204675',
  address: 'Астана, проспект Женис, 8/1',
  // Weekly retail schedule verified in the expanded 2GIS listing on 2026-10-29.
  openingHours: [
    { days: 'Пн–пт', time: '08:30–22:30' },
    { days: 'Сб', time: '09:00–22:30' },
    { days: 'Вс', time: '09:00–22:00' },
  ],
  paymentMethods: 'В магазине — наличные, карта, QR, перевод или оплата через банк.',
  catalogueUrl: 'https://app.florax.kz/ru/in_bloom/bouquets',
  reviewsUrl: 'https://2gis.kz/astana/firm/70000001105801781/tab/reviews',
  mapUrl: 'https://2gis.kz/astana/firm/70000001105801781',
  mapEmbedUrl: `https://widgets.2gis.com/widget?type=firmsonmap&options=${encodeURIComponent(JSON.stringify(mapWidgetOptions))}`,
  instagramUrl: 'https://www.instagram.com/inbloom.flower.ast/',
  instagramHandle: 'inbloom.flower.ast',
} as const;

export const navItems = [
  { label: 'Букеты', href: '/catalog' },
  { label: 'О студии', href: '/#studio' },
  { label: 'Доставка', href: '/#delivery' },
  { label: 'Отзывы', href: '/#reviews' },
  { label: 'Контакты', href: '/#contacts' },
] as const;
