import { CatalogView } from '@/features/catalog/catalog-view';
import { PageHeading } from '@/features/storefront/sections';
export default function CatalogPage() { return <main id="main" className="container"><PageHeading title="Букеты">Выберите букет и уточните состав, наличие и получение у флориста.</PageHeading><CatalogView /></main>; }
