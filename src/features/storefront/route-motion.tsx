'use client';

import { useEffect, useRef, ViewTransition, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ScrollReveals } from '@/features/landing/scroll-reveals';

/** React owns navigation; the header and live catalogue provider stay mounted. */
export function RouteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = content.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Older browsers keep a short fade without creating a transformed ancestor
    // for the mobile order bar. Native View Transitions animate snapshots instead.
    if ('startViewTransition' in document && CSS.supports('view-transition-class: page-swap')) return;
    const animation = element.animate([{ opacity: 0.65 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
    return () => animation.cancel();
  }, [pathname]);

  return <ViewTransition name="storefront-content" update="page-swap" default="none"><div ref={content} className="route-content">{children}<ScrollReveals /></div></ViewTransition>;
}
