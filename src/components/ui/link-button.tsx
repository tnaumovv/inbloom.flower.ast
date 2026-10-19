import type { ReactNode } from 'react';
import { Button } from './button';

export function LinkButton({ href, children, variant = 'primary', external = false, className = '', 'aria-label': ariaLabel }: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'outline';
  external?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  return <Button asChild variant={variant === 'primary' ? 'default' : 'outline'}><a className={`link-button link-button--${variant} ${className}`} href={href} aria-label={ariaLabel} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{children}</a></Button>;
}
