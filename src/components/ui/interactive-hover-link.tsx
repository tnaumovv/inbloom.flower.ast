import type { ComponentProps, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Magic UI Interactive Hover Button (MIT), adapted to native navigation links.
 * Source: https://magicui.design/docs/components/interactive-hover-button
 * License: public/licenses/magic-ui-MIT.txt
 */
export function InteractiveHoverLink({ children, className, icon, variant = 'primary', ...props }: ComponentProps<'a'> & { icon?: ReactNode; variant?: 'primary' | 'outline' }) {
  return <a {...props} className={cn('interactive-link', `interactive-link--${variant}`, className)}>
    <span className="interactive-link-rest"><span className="interactive-link-dot" aria-hidden="true"/><span className="interactive-link-label">{icon}{children}</span></span>
    <span className="interactive-link-hover" aria-hidden="true"><span>{children}</span><ArrowUpRight/></span>
    <span className="interactive-link-arrow" aria-hidden="true"><ArrowUpRight/></span>
  </a>;
}
