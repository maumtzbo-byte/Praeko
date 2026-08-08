import { SOCIAL_PLATFORM_LABELS } from "@/lib/social";
import { formatScheduledDate } from "@/lib/content/labels";
import { formatInsightNumber } from "@/lib/content/format-insights";
import type { TopPost } from "@/lib/agents/results-agent";

// Same tonal-accent language as PlatformBreakdownDonut — rank badges shade
// from dark to light instead of using distinct colors per position.
const RANK_TONES = ["bg-accent-strong", "bg-accent", "bg-accent/50"];

export function TopVideosList({ posts }: { posts: TopPost[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no hay suficientes videos publicados con datos de alcance para armar un top.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-100">
      {posts.map((post, i) => (
        <div key={post.itemId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${RANK_TONES[i] ?? "bg-accent/40"}`}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">{post.topic}</p>
            <p className="text-xs text-zinc-500">
              {formatScheduledDate(post.scheduledDate)} · {SOCIAL_PLATFORM_LABELS[post.platform]}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-zinc-900">{formatInsightNumber(post.engagement)}</p>
            <p className="text-[11px] text-zinc-400">interacciones</p>
          </div>
        </div>
      ))}
    </div>
  );
}
