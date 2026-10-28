import type { LucideIcon } from 'lucide-react';

/** A single, non-interactive watermark inside an information card. */
export function CardAccent({ icon: Icon }: { icon: LucideIcon }) {
  return <span className="card-accent" aria-hidden="true"><Icon strokeWidth={1.2} /></span>;
}
