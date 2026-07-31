/** The Frames logo mark: a square frame split into two mirrored brackets,
 * each rotated 180° from the other — reads as a viewfinder/crop-mark motif
 * (fitting a product about generating photo/video "frames") without being a
 * literal camera icon. Pure stroke, no fill, so it inherits `currentColor`
 * and works on any background the caller puts it on. */
export function FramesMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path
        d="M82,50 L82,72 A10,10 0 0 1 72,82 L28,82 A10,10 0 0 1 18,72 L18,61"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      <path
        d="M18,50 L18,28 A10,10 0 0 1 28,18 L72,18 A10,10 0 0 1 82,28 L82,39"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
    </svg>
  );
}
