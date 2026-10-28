import { Flower2, Leaf, type LucideIcon } from 'lucide-react';

/** Decorative only: the adjacent heading carries each icon's meaning. */
export function IconTile({ icon: Icon, className = '' }: { icon: LucideIcon; className?: string }) {
  return <span className={`icon-tile ${className}`} aria-hidden="true"><Icon strokeWidth={1.35} /></span>;
}

export function BotanicalAccent({ className = '' }: { className?: string }) {
  return <span className={`botanical-accent ${className}`} aria-hidden="true"><Flower2 strokeWidth={.8} /><Leaf strokeWidth={.8} /></span>;
}

/** A single, non-interactive watermark inside an information card. */
export function CardAccent({ icon: Icon }: { icon: LucideIcon }) {
  return <span className="card-accent" aria-hidden="true"><Icon strokeWidth={1.2} /></span>;
}
