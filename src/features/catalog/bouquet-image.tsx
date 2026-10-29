'use client';

import type { Bouquet } from './types';

export function BouquetImage({ bouquet, lazy = false }: { bouquet: Bouquet; lazy?: boolean }) {
  return <img
    key={bouquet.image}
    src={bouquet.image}
    alt={bouquet.imageAlt}
    width={600}
    height={800}
    loading={lazy ? 'lazy' : 'eager'}
    decoding="async"
    style={{ objectPosition: bouquet.imagePosition }}
    ref={image => {
      // An SSR image can fail before React attaches the error listener.
      if (image?.complete && image.naturalWidth === 0) image.style.visibility = 'hidden';
    }}
    onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
    onLoad={event => { event.currentTarget.style.visibility = 'visible'; }}
  />;
}
