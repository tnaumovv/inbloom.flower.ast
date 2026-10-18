const paths = {
  whatsapp: <><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.8a8.5 8.5 0 1 1 16.2-4Z"/><path d="m8.2 7.1 1.5 2.6-.9 1.2a9 9 0 0 0 4.2 4.2l1.2-.9 2.7 1.4c-.4 2-1.7 2.3-3.3 1.8-3.5-1.1-6-3.6-7-7-.4-1.5-.3-2.7 1.6-3.3Z"/></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  truck: <><path d="M2 5h12v12H2zM14 9h4l4 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
  'arrow-up-right': <path d="M6 18 18 6M6 6h12v12"/>,
  'arrow-left': <path d="M20 12H4m7-7-7 7 7 7"/>,
  'arrow-right': <path d="M4 12h16m-7-7 7 7-7 7"/>,
  menu: <path d="M4 8h16M4 16h16"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  play: <path d="m9 5 11 7-11 7Z"/>,
  pause: <path d="M8 5v14M16 5v14"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  phone: <path d="m7 3 3 5-2 2a15 15 0 0 0 6 6l2-2 5 3v3a2 2 0 0 1-2 2A19 19 0 0 1 2 5a2 2 0 0 1 2-2h3Z"/>,
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
