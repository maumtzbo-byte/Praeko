import { Play } from "lucide-react";

// Purely decorative texture behind the hero headline — rows of small,
// unlabeled video-card silhouettes drifting past in alternating
// directions, reusing the same .marquee-track keyframe VideoShowcase/
// SocialProof already use (just overriding duration/direction per row),
// so prefers-reduced-motion already freezes it for free via the existing
// global rule. Dimmed low enough that it reads as ambient motion, not
// content competing with the actual headline.
const ROW_COUNT = 6;
const CARDS_PER_ROW = 9;
const ROW_DURATIONS = [42, 48, 44, 50, 46, 52];

function WallCard() {
  return (
    <div
      aria-hidden="true"
      className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 sm:h-28 sm:w-20"
      style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)" }}
    >
      <Play className="h-3 w-3 fill-white/50 text-white/50 sm:h-4 sm:w-4" />
    </div>
  );
}

export default function HeroVideoWall() {
  const rows = Array.from({ length: ROW_COUNT }, (_, r) => r);
  const cards = Array.from({ length: CARDS_PER_ROW * 2 });

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.34]">
      {/* Same diagonal 3D tilt as the testimonials wall (SocialProof.tsx) —
          perspective on the outer wrapper, rotateX/Y/Z on the row stack —
          so the two "wall of cards" moments in the page read as one
          consistent motif instead of one flat and one tilted. Scaled up
          slightly to cover the corners the rotation exposes. */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1000px" }}>
        <div
          className="flex h-[130%] w-[130%] flex-col justify-between gap-3 py-4 sm:gap-4"
          style={{ transform: "rotateX(13deg) rotateY(-9deg) rotateZ(9deg)", transformStyle: "preserve-3d" }}
        >
          {rows.map((r) => (
            <div key={r} className="marquee-viewport">
              <div
                className="marquee-track flex w-max gap-3 sm:gap-4"
                style={{ animationDuration: `${ROW_DURATIONS[r]}s`, animationDirection: r % 2 === 0 ? "normal" : "reverse" }}
              >
                {cards.map((_, i) => (
                  <WallCard key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
