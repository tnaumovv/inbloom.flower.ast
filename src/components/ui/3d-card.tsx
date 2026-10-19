'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { InteractiveHoverLink } from './interactive-hover-link';
import { ShineBorder } from './shine-border';
import { Icon } from './icon';

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
    const rotateX = useTransform(springY, [-.5, .5], ['3deg', '-3deg']);
    const rotateY = useTransform(springX, [-.5, .5], ['-3deg', '3deg']);
    const reset = () => { mouseX.set(0); mouseY.set(0); };

    React.useEffect(() => {
      if (reducedMotion) {
        mouseX.set(0); mouseY.set(0);
        springX.jump(0); springY.jump(0);
      }
    }, [reducedMotion, mouseX, mouseY, springX, springY]);

    const actionClass = 'bouquet-order';

    return <motion.div ref={ref} data-tilt-card onPointerMove={event => {
      if (reducedMotion || event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const box = event.currentTarget.getBoundingClientRect();
      mouseX.set(Math.max(-.5, Math.min(.5, (event.clientX - box.left) / box.width - .5)));
      mouseY.set(Math.max(-.5, Math.min(.5, (event.clientY - box.top) / box.height - .5)));
    }} onPointerLeave={reset} onPointerCancel={reset} style={{ rotateX: reducedMotion ? 0 : rotateX, rotateY: reducedMotion ? 0 : rotateY, transformStyle: 'preserve-3d' }} className={cn('bouquet-product', className)}>
      <div className="bouquet-product-inner"><ShineBorder/>
        <div className="bouquet-title"><h3 id={titleId}>{title}</h3><p>{subtitle}</p></div>
        <div className="bouquet-photo"><Image src={imageUrl} alt={imageAlt ?? `${title}, ${subtitle}`} fill sizes="(max-width: 600px) 88vw, (max-width: 1023px) 50vw, 32vw" className="object-cover" style={{ objectPosition: imagePosition }}/></div>
        <div className="bouquet-details">
          {actionHref ? <InteractiveHoverLink className={actionClass} href={actionHref} target="_blank" rel="noopener noreferrer" aria-label={actionLabel} icon={<Icon name="whatsapp"/>}>{actionText}</InteractiveHoverLink> : <Button type="button" variant="outline" className={actionClass} onClick={onActionClick} aria-label={actionLabel}>{actionText}</Button>}
        </div>
      </div>
    </motion.div>;
  },
);
InteractiveTravelCard.displayName = 'InteractiveTravelCard';
