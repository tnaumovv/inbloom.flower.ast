import { expect, it } from 'vitest';
import { getFeaturedBouquets } from '@/features/catalog/data';
import { buildBouquetWhatsAppLink, buildWhatsAppLink, customBouquetMessage } from '@/features/contact/whatsapp';

it('opens an enquiry for the selected bouquet at its displayed price', async () => {
  const expected = [['Pink cloud', '15 700 ₸'], ['Blue dream', '20 200 ₸'], ['Soft pink', '13 200 ₸'], ['Mono Sophie', '15 800 ₸'], ['Кашпо Софи С', '12 100 ₸']];
  const bouquets = await getFeaturedBouquets();
  bouquets.slice(0, 5).forEach((bouquet, i) => {
    const url = new URL(buildBouquetWhatsAppLink(bouquet));
    const text = url.searchParams.get('text')!.replace(/[\u00a0\u202f]/g, ' ');
    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/77082204675');
    expect(text).toBe(`Здравствуйте! Хочу заказать «${expected[i][0]}» — ${expected[i][1]}.\nАртикул: ${bouquet.id}.`);
  });
});
it('distinguishes bouquets with the same name and price by their stable catalogue ID', () => {
  const first = new URL(buildBouquetWhatsAppLink({ id: 'bag-303869', name: 'Bag', priceKzt: 7000 }));
  const second = new URL(buildBouquetWhatsAppLink({ id: 'bag-301723', name: 'Bag', priceKzt: 7000 }));
  expect(first.href).not.toBe(second.href);
  expect(first.searchParams.get('text')).toContain('Артикул: bag-303869.');
  expect(second.searchParams.get('text')).toContain('Артикул: bag-301723.');
});
it('round-trips Cyrillic, quotes and URL delimiters without truncating the message', () => {
  const message = 'Хочу «букет» & доставку + открытку?';
  expect(new URL(buildWhatsAppLink(message)).searchParams.get('text')).toBe(message);
});
it('provides a useful general enquiry when called without arguments', () => {
  expect(new URL(buildWhatsAppLink()).searchParams.get('text')).toMatch(/букет/iu);
  expect(new URL(buildWhatsAppLink(customBouquetMessage)).searchParams.get('text')).toMatch(/индивидуальн/iu);
});

it('omits the article line when a direct enquiry has no catalogue ID', () => {
  const text = new URL(buildBouquetWhatsAppLink({ name: 'Пион', priceKzt: 7000 })).searchParams.get('text')!.replace(/[\u00a0\u202f]/g, ' ');
  expect(text).toBe('Здравствуйте! Хочу заказать «Пион» — 7 000 ₸.');
});
