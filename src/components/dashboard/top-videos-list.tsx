import { Play } from "lucide-react";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORM_COLORS, type SocialPlatform } from "@/lib/social";
import { InstagramIcon, FacebookIcon, TikTokIcon, GoogleBusinessIcon } from "@/components/dashboard/social-icons";
import { formatScheduledDate } from "@/lib/content/labels";
import { formatInsightNumber } from "@/lib/content/format-insights";
import type { TopPost } from "@/lib/agents/results-agent";

export interface TopVideoWithMedia extends TopPost {
  mediaUrl: string | null;
}

const PLATFORM_ICONS: Record<SocialPlatform, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  google_business: GoogleBusinessIcon,
};

// Same tonal-accent rank badges used elsewhere (engagement rings, etc.) —
// dark to light instead of a distinct color per position.
const RANK_TONES = ["bg-accent-strong", "bg-accent", "bg-accent/50"];

export function TopVideosList({ posts }: { posts: TopVideoWithMedia[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no hay suficientes videos publicados con datos de alcance para armar un top.
      </p>
    );
  }

  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
      {posts.map((post, i) => {
        const PlatformIcon = PLATFORM_ICONS[post.platform];
        return (
          <div key={post.itemId} className="flex w-28 shrink-0 flex-col gap-2 sm:w-auto">
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-zinc-900">
              {post.mediaUrl ? (
                <video
                  src={post.mediaUrl}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                  <Play className="h-6 w-6 text-zinc-500" strokeWidth={1.5} />
                </div>
              )}
              <span
                className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white ${RANK_TONES[i] ?? "bg-accent/40"}`}
              >
                {i + 1}
              </span>
              <span
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90"
                style={{ color: SOCIAL_PLATFORM_COLORS[post.platform] }}
              >
                <PlatformIcon className="h-3.5 w-3.5" />
              </span>
              {post.impressions !== null && (
                <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  <Play className="h-3 w-3 fill-current" />
                  {formatInsightNumber(post.impressions)}
                </span>
              )}
            </div>
            <div>
              <p className="truncate text-sm font-semibold text-zinc-900">{post.topic}</p>
              <p className="text-xs text-zinc-500">
                {formatScheduledDate(post.scheduledDate)} · {SOCIAL_PLATFORM_LABELS[post.platform]}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {formatInsightNumber(post.engagement)} interacciones
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
