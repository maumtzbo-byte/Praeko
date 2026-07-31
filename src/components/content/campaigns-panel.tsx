"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone, Sparkles, Layers } from "lucide-react";
import { createCampaign } from "@/app/dashboard/campanas/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatScheduledDate } from "@/lib/content/labels";
import {
  deriveCampaignStatus,
  campaignProgress,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_VARIANTS,
} from "@/lib/content/campaign-status";
import type { Tables } from "@/lib/supabase/types";

type Campaign = Tables<"campaigns">;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultEndDate() {
  const d = new Date();
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

/** Creating a campaign is the same paid Claude call as "Generar contenido" — same confirm-before-spend pattern. */
function CreateCampaignForm({ businessId, onCreated }: { businessId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [errors, setErrors] = useState<{ name?: string; brief?: string; endDate?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Ponle un nombre a la campaña.";
    if (!brief.trim()) next.brief = "Cuéntanos de qué trata la campaña.";
    if (endDate < startDate) next.endDate = "La fecha de fin debe ser igual o posterior a la de inicio.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await createCampaign(businessId, { name: name.trim(), brief: brief.trim(), startDate, endDate });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(`Campaña creada con ${res.data.created} piezas planeadas. Te quedan ${res.data.runsRemainingToday} generaciones hoy.`);
      setOpen(false);
      setConfirming(false);
      setName("");
      setBrief("");
      setStartDate(todayIso());
      setEndDate(defaultEndDate());
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Megaphone className="h-4 w-4" />
        Crear campaña
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div>
          <Label htmlFor="campaign-name" required>
            Nombre de la campaña
          </Label>
          <Input
            id="campaign-name"
            placeholder="Hot Sale, Navidad, aniversario…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={!!errors.name}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <Label htmlFor="campaign-brief" required>
            ¿De qué trata? ¿Qué quieres lograr?
          </Label>
          <Textarea
            id="campaign-brief"
            placeholder="Ej. Hot Sale con 20% de descuento en toda la tienda, queremos vender el inventario de temporada antes de fin de mes."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            invalid={!!errors.brief}
          />
          <FieldError message={errors.brief} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="campaign-start" required>
              Empieza
            </Label>
            <Input
              id="campaign-start"
              type="date"
              value={startDate}
              min={todayIso()}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="campaign-end" required>
              Termina
            </Label>
            <Input
              id="campaign-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              invalid={!!errors.endDate}
            />
            <FieldError message={errors.endDate} />
          </div>
        </div>

        {confirming ? (
          <Alert variant="info" className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Esto va a usar tu API key de Claude (cuesta unos centavos de dólar). ¿Generar la campaña?</span>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSubmit} loading={submitting}>
                Confirmar generación
              </Button>
            </div>
          </Alert>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => validate() && setConfirming(true)}>
              <Sparkles className="h-4 w-4" />
              Generar campaña
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignCard({ campaign, pieceCount }: { campaign: Campaign; pieceCount: number }) {
  const displayStatus = deriveCampaignStatus(campaign);
  const progress = campaignProgress(campaign);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
              <Megaphone className="h-4 w-4 text-accent" strokeWidth={1.75} />
            </span>
            <p className="text-sm font-semibold text-zinc-900">{campaign.name}</p>
          </div>
          <Badge variant={CAMPAIGN_STATUS_VARIANTS[displayStatus]}>{CAMPAIGN_STATUS_LABELS[displayStatus]}</Badge>
        </div>
        <p className="line-clamp-2 text-sm text-zinc-600">{campaign.brief}</p>
        <p className="text-xs text-zinc-500">
          {formatScheduledDate(campaign.start_date)} — {formatScheduledDate(campaign.end_date)}
        </p>
        <Progress value={progress} />
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Layers className="h-3.5 w-3.5" />
          {pieceCount} {pieceCount === 1 ? "pieza planeada" : "piezas planeadas"}
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignsPanel({
  businessId,
  campaigns,
  pieceCountsByCampaign,
}: {
  businessId: string;
  campaigns: Campaign[];
  pieceCountsByCampaign: Record<string, number>;
}) {
  const router = useRouter();
  const createForm = <CreateCampaignForm businessId={businessId} onCreated={() => router.refresh()} />;

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Todavía no tienes campañas"
        description="Describe qué quieres lograr — Hot Sale, Navidad, un aniversario — y por cuánto tiempo, y tus agentes arman el plan completo día por día."
        action={createForm}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">{createForm}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} pieceCount={pieceCountsByCampaign[campaign.id] ?? 0} />
        ))}
      </div>
    </div>
  );
}
