import type { ReactNode } from 'react';

export function LinkButton({ href, children, variant = 'primary', external = false, className = '' }: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'outline';
  external?: boolean;
  className?: string;
}) {
  return <a className={`link-button link-button--${variant} ${className}`} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{children}</a>;
}
