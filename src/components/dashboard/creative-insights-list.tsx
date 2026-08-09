import { BarChart3, CalendarDays, Lightbulb } from "lucide-react";
import type { CreativeInsight } from "@/lib/agents/results-agent";

const ICONS: Record<CreativeInsight["kind"], typeof BarChart3> = {
  content_kind: BarChart3,
  weekday: CalendarDays,
  recommendation: Lightbulb,
};

export function CreativeInsightsList({ insights }: { insights: CreativeInsight[] }) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Necesitamos más publicaciones con datos de alcance para generar recomendaciones.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {insights.map((insight) => {
        const Icon = ICONS[insight.kind];
        return (
          <div key={insight.title} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{insight.title}</p>
              <p className="text-xs text-zinc-500">{insight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
