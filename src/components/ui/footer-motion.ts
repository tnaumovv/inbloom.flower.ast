import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Loaded only near the desktop footer; mobile keeps the lightweight static layout. */
export function mountFooterMotion(element: HTMLDivElement) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(element.querySelector('[data-footer-wordmark]'), {
      y: () => window.innerHeight * 0.1, scale: 0.86, opacity: 0.05,
    }, {
      y: 0, scale: 1, opacity: 0.4, ease: 'none',
      scrollTrigger: { trigger: element, start: 'top 80%', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
    });
    // Tie the reveal to scroll progress so it also reverses when scrolling up.
    gsap.fromTo(element.querySelectorAll('[data-footer-reveal]'), {
      y: 48, opacity: 0.2,
    }, {
      y: 0, opacity: 1, stagger: 0.15, ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 65%', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
    });
  }, element);
  media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const cleanups = [...element.querySelectorAll<HTMLElement>('[data-magnetic]')].map(target => {
      const xTo = gsap.quickTo(target, 'x', { duration: 0.35, ease: 'power2.out' });
      const yTo = gsap.quickTo(target, 'y', { duration: 0.35, ease: 'power2.out' });
      const move = (event: PointerEvent) => {
        const rect = target.getBoundingClientRect();
        xTo(gsap.utils.clamp(-8, 8, (event.clientX - rect.left - rect.width / 2) * 0.12));
        yTo(gsap.utils.clamp(-6, 6, (event.clientY - rect.top - rect.height / 2) * 0.12));
      };
      const reset = () => { xTo(0); yTo(0); };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerleave', reset);
      target.addEventListener('focusin', reset);
      return () => {
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerleave', reset);
        target.removeEventListener('focusin', reset);
      };
    });
    return () => cleanups.forEach(cleanup => cleanup());
  }, element);

  const resize = new ResizeObserver(() => ScrollTrigger.refresh());
  const content = document.querySelector('.route-content');
  if (content) resize.observe(content);
  return () => { media.revert(); resize.disconnect(); };
}
