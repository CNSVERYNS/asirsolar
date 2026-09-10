// Minimal line-icon set — 24x24, stroke-based, matches the site's
// restrained/geometric design language. currentColor so each usage site
// controls its own color via CSS.

type IconProps = {
  size?: number;
  className?: string;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SunIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="12" x2="20" y2="12" />
      <line x1="15.89" y1="8.11" x2="17.66" y2="6.34" />
      <line x1="12" y1="6.5" x2="12" y2="4" />
      <line x1="8.11" y1="8.11" x2="6.34" y2="6.34" />
      <line x1="6.5" y1="12" x2="4" y2="12" />
      <line x1="8.11" y1="15.89" x2="6.34" y2="17.66" />
      <line x1="12" y1="17.5" x2="12" y2="20" />
      <line x1="15.89" y1="15.89" x2="17.66" y2="17.66" />
    </svg>
  );
}

export function PanelIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <rect x="3" y="5" width="18" height="14" rx="1.2" />
      <line x1="9" y1="5" x2="9" y2="19" />
      <line x1="15" y1="5" x2="15" y2="19" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

export function CompassIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M12 4 L7 20" />
      <path d="M12 4 L17 20" />
      <path d="M5 20 L9 20" />
      <path d="M15 20 L19 20" />
      <circle cx="12" cy="4" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BoltIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeLinejoin="round">
      <path d="M13 2 L6 13 H11 L9 22 L18 10 H12 Z" />
    </svg>
  );
}

export function PowerIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M12 3 V11" />
      <path d="M6.5 6.5 a8 8 0 1 0 11 0" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" />
      <path d="M8.5 12 L10.8 14.3 L15.5 9.5" />
    </svg>
  );
}

export const serviceIcons = {
  sun: SunIcon,
  panel: PanelIcon,
  compass: CompassIcon,
  bolt: BoltIcon,
  power: PowerIcon,
  shield: ShieldCheckIcon,
} as const;

export type ServiceIconKey = keyof typeof serviceIcons;
