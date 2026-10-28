export type Bouquet = Readonly<{
  id: string;
  slug: string;
  name: string;
  priceKzt: number;
  image: string;
  imageAlt: string;
  imagePosition?: string;
  description?: string;
  composition?: readonly string[];
  category?: string;
}>;

export type CatalogSnapshot = Readonly<{
  bouquets: readonly Bouquet[];
  source: 'sheets' | 'preview';
  status: 'ok' | 'unavailable';
  revision: string;
}>;
