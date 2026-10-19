import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/** Magic UI Shine Border (MIT). Source: https://magicui.design/docs/components/shine-border
 * Adapted palette and CSS animation; see public/licenses/magic-ui-MIT.txt. */
export function ShineBorder({ className, duration = 14, shineColor = ['#b7a37b', '#e7b8ad'] }: { className?: string; duration?: number; shineColor?: string[] }) {
  return <span aria-hidden="true" className={cn('shine-border', className)} style={{
    '--shine-duration': `${duration}s`,
    backgroundImage: `radial-gradient(transparent, transparent, ${shineColor.join(',')}, transparent, transparent)`,
    backgroundSize: '300% 300%',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor', maskComposite: 'exclude',
  } as CSSProperties}/>;
}
