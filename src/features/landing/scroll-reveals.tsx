'use client';

import { useEffect } from 'react';

export function ScrollReveals() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = 'visible';
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -48px 0px' });

    // Enhance only content below the viewport; server HTML stays readable without JS.
    for (const element of elements) {
      if (element.getBoundingClientRect().top < window.innerHeight - 48) {
        element.dataset.reveal = 'visible';
      } else {
        element.dataset.reveal = 'pending';
        observer.observe(element);
      }
    }

    const stopMotion = () => {
      if (!motion.matches) return;
      observer.disconnect();
      elements.forEach(element => { element.dataset.reveal = 'visible'; });
    };
    motion.addEventListener('change', stopMotion);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', stopMotion);
      elements.forEach(element => { element.dataset.reveal = ''; });
    };
  }, []);

  return null;
}
