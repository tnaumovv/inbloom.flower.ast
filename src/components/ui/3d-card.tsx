'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export type InteractiveTravelCardProps = {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt?: string;
  imagePosition?: string;
  actionText: string;
  actionLabel?: string;
  titleId?: string;
  className?: string;
} & ({ actionHref: string; onActionClick?: never } | { actionHref?: undefined; onActionClick: () => void });

/** Adapted from the supplied card, with native order links and reduced-motion support. */
export const InteractiveTravelCard = React.forwardRef<HTMLDivElement, InteractiveTravelCardProps>(
  ({ title, subtitle, imageUrl, imageAlt, imagePosition = 'center', actionText, actionHref, onActionClick, actionLabel, titleId, className }, ref) => {
    const reducedMotion = useReducedMotion();
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { damping: 22, stiffness: 170 });
    const springY = useSpring(mouseY, { damping: 22, stiffness: 170 });
    const rotateX = useTransform(springY, [-.5, .5], ['8.5deg', '-8.5deg']);
    const rotateY = useTransform(springX, [-.5, .5], ['-8.5deg', '8.5deg']);
    const reset = () => { mouseX.set(0); mouseY.set(0); };

    React.useEffect(() => {
      if (reducedMotion) {
        mouseX.set(0); mouseY.set(0);
        springX.jump(0); springY.jump(0);
      }
    }, [reducedMotion, mouseX, mouseY, springX, springY]);

    const actionClass = 'flex min-h-12 w-full items-center justify-center rounded-xl bg-white/15 px-3 py-3 text-center text-sm font-semibold text-white ring-1 ring-inset ring-white/40 backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:bg-white/25';
    const lift = { transform: reducedMotion ? 'none' : 'translateZ(28px)' };

    return <motion.div ref={ref} data-tilt-card onPointerMove={event => {
      if (reducedMotion || event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const box = event.currentTarget.getBoundingClientRect();
      mouseX.set(Math.max(-.5, Math.min(.5, (event.clientX - box.left) / box.width - .5)));
      mouseY.set(Math.max(-.5, Math.min(.5, (event.clientY - box.top) / box.height - .5)));
    }} onPointerLeave={reset} onPointerCancel={reset} style={{ rotateX: reducedMotion ? 0 : rotateX, rotateY: reducedMotion ? 0 : rotateY, transformStyle: 'preserve-3d' }} className={cn('relative h-[35rem] w-full rounded-2xl max-[600px]:h-[33rem]', className)}>
      <div className="absolute inset-0 rounded-2xl bg-[#5b6542]" style={{ ...lift, transformStyle: 'preserve-3d' }}>
        <Image src={imageUrl} alt={imageAlt ?? `${title}, ${subtitle}`} fill sizes="(max-width: 600px) 88vw, (max-width: 1023px) 50vw, 440px" className="rounded-2xl object-cover" style={{ objectPosition: imagePosition }}/>
        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(13,24,15,.72)_0%,rgba(13,24,15,.72)_18%,transparent_36%,transparent_69%,rgba(13,24,15,.78)_88%,rgba(13,24,15,.82)_100%)]"/>
        <div className="relative flex h-full flex-col justify-between p-6 text-white" style={lift}>
          <div className="min-w-0"><h3 id={titleId} className="font-heading text-[1.875rem] font-normal leading-[1.1] tracking-[-.04em]">{title}</h3><p className="mt-2 text-base font-medium text-white">{subtitle}</p></div>
          {actionHref ? <motion.a href={actionHref} target="_blank" rel="noopener noreferrer" aria-label={actionLabel} whileHover={reducedMotion ? undefined : { scale: 1.025 }} whileTap={reducedMotion ? undefined : { scale: .98 }} className={actionClass}>{actionText}</motion.a> : <motion.button type="button" onClick={onActionClick} aria-label={actionLabel} whileHover={reducedMotion ? undefined : { scale: 1.025 }} whileTap={reducedMotion ? undefined : { scale: .98 }} className={actionClass}>{actionText}</motion.button>}
        </div>
      </div>
    </motion.div>;
  },
);
InteractiveTravelCard.displayName = 'InteractiveTravelCard';
