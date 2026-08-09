import { Trophy } from "lucide-react";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORM_COLORS, type SocialPlatform } from "@/lib/social";
import { InstagramIcon, FacebookIcon, TikTokIcon, GoogleBusinessIcon } from "@/components/dashboard/social-icons";

export interface PlatformRingData {
  platform: SocialPlatform;
  engagementRatePct: number;
  followerGrowthPct: number | null;
}

const PLATFORM_ICONS: Record<SocialPlatform, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  google_business: GoogleBusinessIcon,
};

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Ring({ platform, engagementRatePct }: { platform: SocialPlatform; engagementRatePct: number }) {
  const clamped = Math.min(100, Math.max(0, engagementRatePct));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const color = SOCIAL_PLATFORM_COLORS[platform];

  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16 sm:h-24 sm:w-24">
      <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#e4e4e7" strokeWidth="7" />
      <circle
        cx="40"
        cy="40"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" className="fill-zinc-900 text-[17px] font-semibold">
        {Math.round(engagementRatePct)}%
      </text>
    </svg>
  );
}

/**
 * Each ring is an independent real number — interactions ÷ impressions
 * for that platform — not a share of a combined total, so they don't
 * (and shouldn't) add up to 100%. "Tu mejor red" is whichever platform
 * has the highest real engagement rate, not a fixed pick.
 */
export function EngagementRateRings({ data }: { data: PlatformRingData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">Sin datos de engagement por red todavía.</p>;
  }

  const best = data[0];
  const BestIcon = PLATFORM_ICONS[best.platform];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {data.map((ring) => {
          const Icon = PLATFORM_ICONS[ring.platform];
          return (
            <div key={ring.platform} className="flex flex-col items-center gap-2 text-center">
              <Ring platform={ring.platform} engagementRatePct={ring.engagementRatePct} />
              <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                <Icon className="h-4 w-4" style={{ color: SOCIAL_PLATFORM_COLORS[ring.platform] }} />
                {SOCIAL_PLATFORM_LABELS[ring.platform]}
              </div>
              {ring.followerGrowthPct !== null && (
                <p className={ring.followerGrowthPct >= 0 ? "text-xs font-medium text-emerald-600" : "text-xs font-medium text-red-600"}>
                  {ring.followerGrowthPct >= 0 ? "↑" : "↓"} {Math.abs(ring.followerGrowthPct)}%
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-start gap-3 rounded-xl bg-accent/[0.06] p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-accent shadow-sm">
          <Trophy className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
            Tu mejor red esta semana: {SOCIAL_PLATFORM_LABELS[best.platform]}
            <BestIcon className="h-3.5 w-3.5" style={{ color: SOCIAL_PLATFORM_COLORS[best.platform] }} />
          </p>
          <p className="text-xs text-zinc-500">
            {Math.round(best.engagementRatePct)}% de tasa de interacción — la más alta de tus redes conectadas.
          </p>
        </div>
      </div>
    </div>
  );
}
