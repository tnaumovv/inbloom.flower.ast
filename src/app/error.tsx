'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { reset: () => void }) { return <main id="main" className="container error-page"><h1 className="display">Не удалось открыть страницу</h1><p>Попробуйте ещё раз или вернитесь в каталог.</p><button className="pill" onClick={reset}>Попробовать снова</button>{' '}<Link className="pill outline" href="/catalog">В каталог</Link></main>; }
