'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';

export function useBouquetCarousel() {
  const autoScroll = useMemo(() => AutoScroll({ speed: .8, playOnInit: false, stopOnInteraction: true, stopOnFocusIn: false }), []);
  const [viewportRef, api] = useEmblaCarousel({ loop: true, align: 'start', breakpoints: { '(max-width: 600px)': { align: 'center' } } }, [autoScroll]);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const policy = useRef({ visible: false, hovered: false, focused: false, dragging: false, hidden: false, reduced: false, resumeDelay: 500 });

  const syncPlayback = useCallback(() => {
    if (!api) return;
    const state = policy.current;
    if (state.visible && !state.hovered && !state.focused && !state.dragging && !state.hidden && !state.reduced) autoScroll.play(state.resumeDelay);
    else autoScroll.stop();
  }, [api, autoScroll]);

  useEffect(() => {
    if (!api) return;
    const viewport = api.rootNode();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const select = () => setSelected(api.selectedScrollSnap());
    const play = () => setPlaying(true);
    const stop = () => setPlaying(false);
    const reinit = () => { select(); syncPlayback(); };
    const pointerDown = () => { policy.current.dragging = true; syncPlayback(); };
    const pointerUp = () => { policy.current.dragging = false; syncPlayback(); };
    const visibility = () => { policy.current.hidden = document.hidden; syncPlayback(); };
    const preference = () => {
      policy.current.reduced = motion.matches;
      syncPlayback();
      if (motion.matches) api.scrollTo(api.selectedScrollSnap(), true);
    };
    const observer = new IntersectionObserver(([entry]) => {
      policy.current.visible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: .15 });
    api.on('select', select).on('reInit', reinit).on('pointerDown', pointerDown).on('pointerUp', pointerUp).on('autoScroll:play', play).on('autoScroll:stop', stop);
    observer.observe(viewport);
    motion.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    preference();
    visibility();
    return () => {
      observer.disconnect();
      autoScroll.stop();
      api.off('select', select).off('reInit', reinit).off('pointerDown', pointerDown).off('pointerUp', pointerUp).off('autoScroll:play', play).off('autoScroll:stop', stop);
      motion.removeEventListener('change', preference);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [api, autoScroll, syncPlayback]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    policy.current.resumeDelay = event.pointerType === 'mouse' ? 500 : 1600;
  };
  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    policy.current.resumeDelay = 500;
    policy.current.hovered = true;
    syncPlayback();
  };
  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    policy.current.hovered = false;
    syncPlayback();
  };
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    policy.current.focused = (event.target as HTMLElement).matches(':focus-visible');
    syncPlayback();
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    policy.current.focused = false;
    syncPlayback();
  };
  const navigate = (target: 'next' | 'previous' | number) => {
    if (!api) return;
    policy.current.focused = true;
    autoScroll.stop();
    api.rootNode().scrollLeft = 0;
    const jump = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (target === 'next') api.scrollNext(jump);
    else if (target === 'previous') api.scrollPrev(jump);
    else api.scrollTo(target, jump);
  };

  return { viewportRef, ready: Boolean(api), selected, playing, navigate, onPointerDown, onPointerEnter, onPointerLeave, onFocus, onBlur };
}
