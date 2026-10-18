export function BotanicalEdge({ tone, placement }: { tone: 'cream' | 'olive'; placement: 'top' | 'bottom' }) {
  return <div className={`botanical-edge botanical-edge--${tone} botanical-edge--${placement}`} aria-hidden="true" />;
}
