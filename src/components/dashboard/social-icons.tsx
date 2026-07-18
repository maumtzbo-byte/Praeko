// Lightweight brand marks for the "Redes sociales" cards — lucide-react
// (already used everywhere else in the app) dropped brand/logo icons from
// its set, so these are small hand-drawn stand-ins built from basic SVG
// primitives rather than copied logo path data. Same `className`/size
// contract as a lucide icon so they drop into the same spots.

type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="6" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.25" cy="6.75" r="1.15" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M13.8 8.4h1.4V6h-1.8c-1.7 0-2.8 1.1-2.8 2.9v1.3H9v2.4h1.6V18h2.5v-5.4h1.7l.3-2.4h-2v-1c0-.5.2-.8.7-.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M13.5 3.5c.4 1.9 1.6 3.1 3.6 3.3v2.5c-1.3 0-2.5-.4-3.6-1.1v5.4a4.85 4.85 0 1 1-4.85-4.85c.24 0 .48.02.71.05v2.55a2.3 2.3 0 1 0 1.64 2.2V3.5h2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
