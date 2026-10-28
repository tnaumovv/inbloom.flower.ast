import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/features/catalog/sheets';
import { ProductView } from '@/features/catalog/product-view';
export default async function BouquetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  if (catalog.status === 'ok' && !catalog.bouquets.some(p => p.slug === slug)) notFound();
  return <main id="main" className="container product-page"><div className="page-heading" style={{ marginBottom: 12 }}><Link className="breadcrumb" href="/catalog">↖ Вернуться в каталог</Link></div><ProductView slug={slug} /></main>;
}
