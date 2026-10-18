'use client';

import { useEffect } from 'react';

export function ScrollReveals() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (motion.matches || entry.isIntersecting || entry.boundingClientRect.bottom <= 0) {
          element.dataset.reveal = 'visible';
        } else if (entry.boundingClientRect.top >= window.innerHeight - 64) {
          element.dataset.reveal = 'pending';
        }
      }
    }, { rootMargin: '0px 0px -64px 0px' });

    const updatePreference = () => {
      for (const element of elements) {
        // Keep server HTML readable; only stage content below the viewport for entry.
        element.dataset.reveal = !motion.matches && element.getBoundingClientRect().top >= window.innerHeight - 64 ? 'pending' : 'visible';
        observer.observe(element);
      }
    };
    updatePreference();
    motion.addEventListener('change', updatePreference);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', updatePreference);
      elements.forEach(element => { element.dataset.reveal = ''; });
    };
  }, []);

  return null;
}
