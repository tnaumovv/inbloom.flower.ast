const priceFormatter = new Intl.NumberFormat('ru-KZ', {
  style: 'currency',
  currency: 'KZT',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatPriceKzt(priceKzt: number): string {
  return priceFormatter.format(priceKzt);
}
