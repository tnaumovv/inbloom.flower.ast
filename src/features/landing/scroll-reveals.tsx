'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { animate } from 'framer-motion';

const revealTargets = '.hero-copy,.hero-image,.page-heading,.section-title,.product-card,.editorial-photo,.editorial-panel,.step,.contact-data,.map,.story-intro>div,.approach article,.delivery-panel,.banner-copy,.banner-img,.offer-template,.disclosures details';

export function ScrollReveals() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.route-content');
    if (!root || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet<HTMLElement>();
    const staged = new Map<HTMLElement, { transform: string; opacity: string; index: number }>();
    const running = new Map<HTMLElement, ReturnType<typeof animate>>();
    let sequence = 0;
    let disposed = false;

    const restore = (element: HTMLElement) => {
      const initial = staged.get(element);
      if (!initial) return;
      element.style.transform = initial.transform;
      element.style.opacity = initial.opacity;
      element.style.removeProperty('will-change');
      element.dataset.reveal = 'visible';
      staged.delete(element);
      running.delete(element);
    };
    const reveal = (element: HTMLElement, immediate = false) => {
      const initial = staged.get(element);
      if (!initial) return;
      observer.unobserve(element);
      if (immediate || preference.matches) { running.get(element)?.stop(); restore(element); return; }
      const rect = element.getBoundingClientRect();
      const centered = Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2) < 40;
      const side = centered ? (initial.index % 2 ? 1 : -1) : (rect.left + rect.width / 2 < window.innerWidth / 2 ? -1 : 1);
      const distance = window.innerWidth < 701 ? 18 : 32;
      element.dataset.reveal = 'entering';
      element.style.willChange = 'transform, opacity';
      const control = animate(element, {
        opacity: [0, 1],
        transform: [`translate3d(${side * distance}px, 28px, 0)`, 'translate3d(0, 0, 0)'],
      }, { duration: 0.65, delay: (initial.index % 3) * 0.07, ease: [0.22, 1, 0.36, 1], onComplete: () => { queueMicrotask(() => { if (!disposed) { running.get(element)?.stop(); restore(element); } }); } });
      running.set(element, control);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting || entry.boundingClientRect.bottom <= 0) reveal(entry.target as HTMLElement);
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    const register = () => {
      for (const element of [...staged.keys()]) {
        if (!root.contains(element)) { observer.unobserve(element); running.get(element)?.stop(); restore(element); }
      }
      for (const element of root.querySelectorAll<HTMLElement>(revealTargets)) {
        if (seen.has(element)) continue;
        seen.add(element);
        const rect = element.getBoundingClientRect();
        const index = sequence++;
        // Server HTML and restored scroll positions stay readable. Only offscreen
        // content and the initial hero sequence are staged after JavaScript starts.
        const hero = element.matches('.hero-copy,.hero-image') && window.scrollY < 24;
        if (preference.matches || (!hero && rect.top < window.innerHeight - 20) || rect.width === 0 || rect.height === 0) {
          element.dataset.reveal = 'visible';
          continue;
        }
        staged.set(element, { transform: element.style.transform, opacity: element.style.opacity, index });
        element.dataset.reveal = 'pending';
        element.style.opacity = '0';
        if (hero) reveal(element); else observer.observe(element);
      }
    };
    const onPreference = () => {
      if (preference.matches) for (const element of [...staged.keys()]) reveal(element, true);
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) for (const element of [...staged.keys()]) if (element.contains(event.target)) reveal(element, true);
    };
    const onPageShow = () => {
      for (const element of [...staged.keys()]) if (element.getBoundingClientRect().top < window.innerHeight) reveal(element, true);
    };
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener('change', onPreference);
    root.addEventListener('focusin', onFocus);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      disposed = true;
      observer.disconnect(); mutations.disconnect();
      preference.removeEventListener('change', onPreference);
      root.removeEventListener('focusin', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      for (const control of running.values()) control.stop();
      for (const element of [...staged.keys()]) restore(element);
    };
  }, [pathname]);
  return null;
}
