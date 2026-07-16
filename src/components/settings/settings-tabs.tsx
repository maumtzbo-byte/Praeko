"use client";

import { useState } from "react";
import type {
  BusinessInfoInput,
  BrandInfoInput,
  SocialLinksInput,
  GoalsInput,
  CompetitionInput,
  ProductsInput,
  AiInfoInput,
} from "@/lib/validation/onboarding";
import type { NotificationPreferences } from "@/app/dashboard/configuracion/actions";
import { cn } from "@/lib/utils";
import { BusinessInfoTab } from "./business-info-tab";
import { BrandInfoTab } from "./brand-info-tab";
import { GoalsTab } from "./goals-tab";
import { SocialLinksTab } from "./social-links-tab";
import { CompetitionTab } from "./competition-tab";
import { ProductsTab } from "./products-tab";
import { AiInfoTab } from "./ai-info-tab";
import { SecurityTab } from "./security-tab";
import { NotificationsTab } from "./notifications-tab";

const TABS = [
  { key: "general", label: "Datos generales" },
  { key: "marca", label: "Branding" },
  { key: "objetivos", label: "Objetivos" },
  { key: "redes", label: "Redes sociales" },
  { key: "competencia", label: "Competencia" },
  { key: "productos", label: "Productos" },
  { key: "ia", label: "Info. para la IA" },
  { key: "seguridad", label: "Seguridad" },
  { key: "notificaciones", label: "Notificaciones" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export interface SettingsInitialData {
  businessId: string;
  logoUrl: string | null;
  general: BusinessInfoInput;
  marca: BrandInfoInput;
  redes: SocialLinksInput;
  objetivos: GoalsInput;
  competencia: CompetitionInput;
  productos: ProductsInput;
  ia: AiInfoInput;
  notificaciones: NotificationPreferences;
}

export function SettingsTabs({ initial, defaultTab }: { initial: SettingsInitialData; defaultTab?: string }) {
  const initialTab = TABS.some((t) => t.key === defaultTab) ? (defaultTab as TabKey) : "general";
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <nav className="flex gap-1 overflow-x-auto pb-2 lg:w-56 lg:flex-none lg:flex-col lg:overflow-visible lg:pb-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
              tab === t.key ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1">
        {tab === "general" && <BusinessInfoTab businessId={initial.businessId} initial={initial.general} />}
        {tab === "marca" && (
          <BrandInfoTab businessId={initial.businessId} initial={initial.marca} initialLogoUrl={initial.logoUrl} />
        )}
        {tab === "objetivos" && <GoalsTab businessId={initial.businessId} initial={initial.objetivos} />}
        {tab === "redes" && <SocialLinksTab businessId={initial.businessId} initial={initial.redes} />}
        {tab === "competencia" && <CompetitionTab businessId={initial.businessId} initial={initial.competencia} />}
        {tab === "productos" && <ProductsTab businessId={initial.businessId} initial={initial.productos} />}
        {tab === "ia" && <AiInfoTab businessId={initial.businessId} initial={initial.ia} />}
        {tab === "seguridad" && <SecurityTab />}
        {tab === "notificaciones" && (
          <NotificationsTab businessId={initial.businessId} initial={initial.notificaciones} />
        )}
      </div>
    </div>
  );
}
