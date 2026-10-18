import { expect, it } from 'vitest';
import { getFeaturedBouquets } from '@/features/catalog/data';
import { buildBouquetWhatsAppLink, buildWhatsAppLink, customBouquetMessage } from '@/features/contact/whatsapp';

it('opens an enquiry for the selected bouquet at its displayed price', async () => {
  const expected = [['Cloud', '18 700 ₸'], ['White bloom', '13 200 ₸'], ['Soft s', '10 700 ₸'], ['Sophie basket S', '12 100 ₸']];
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
