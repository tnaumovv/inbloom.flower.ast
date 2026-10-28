import { expect, it } from 'vitest';
import { getFeaturedBouquets } from '@/features/catalog/data';
import { buildBouquetWhatsAppLink, buildWhatsAppLink, customBouquetMessage } from '@/features/contact/whatsapp';

it('opens an enquiry for the selected bouquet at its displayed price', async () => {
  const expected = [['Pink cloud', '15 700 ₸'], ['Blue dream', '20 200 ₸'], ['Soft pink', '13 200 ₸'], ['Mono Sophie', '15 800 ₸'], ['Кашпо Софи С', '12 100 ₸']];
  const bouquets = await getFeaturedBouquets();
  bouquets.forEach((bouquet, i) => {
    const url = new URL(buildBouquetWhatsAppLink(bouquet));
    const text = url.searchParams.get('text')!.replace(/[\u00a0\u202f]/g, ' ');
    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/77082204675');
    expect(text).toContain(`«${expected[i][0]}»`);
    expect(text).toContain(expected[i][1]);
    expect(text).toMatch(/наличие.*доставк/iu);
  });
});
it('round-trips Cyrillic, quotes and URL delimiters without truncating the message', () => {
  const message = 'Хочу «букет» & доставку + открытку?';
  expect(new URL(buildWhatsAppLink(message)).searchParams.get('text')).toBe(message);
});
it('provides a useful general enquiry when called without arguments', () => {
  expect(new URL(buildWhatsAppLink()).searchParams.get('text')).toMatch(/букет/iu);
  expect(new URL(buildWhatsAppLink(customBouquetMessage)).searchParams.get('text')).toMatch(/индивидуальн/iu);
});
