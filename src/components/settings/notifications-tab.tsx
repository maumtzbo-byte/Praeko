"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveNotificationPreferences, type NotificationPreferences } from "@/app/dashboard/configuracion/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { SettingsSection } from "./settings-section";

const NOTIFICATION_ITEMS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    key: "content_ready",
    label: "Contenido listo",
    description: "Avísame cuando una pieza generada esté lista para revisar.",
  },
  {
    key: "weekly_summary",
    label: "Resumen semanal",
    description: "Un resumen de rendimiento cada semana.",
  },
  {
    key: "billing",
    label: "Facturación",
    description: "Recordatorios de pago y recibos.",
  },
];

export function NotificationsTab({
  businessId,
  initial,
}: {
  businessId: string;
  initial: NotificationPreferences;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await saveNotificationPreferences(businessId, value);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    toast.success("Preferencias de notificación actualizadas.");
  }

  return (
    <SettingsSection
      title="Notificaciones"
      description="Qué avisos quieres recibir por correo."
      saving={saving}
      onSave={handleSave}
    >
      <div className="flex flex-col gap-4">
        {NOTIFICATION_ITEMS.map((item) => (
          <label key={item.key} className="flex items-start gap-3">
            <Checkbox
              checked={value[item.key]}
              onChange={(e) => setValue((v) => ({ ...v, [item.key]: e.target.checked }))}
            />
            <span>
              <span className="block text-sm font-medium text-zinc-800">{item.label}</span>
              <span className="block text-xs text-zinc-500">{item.description}</span>
            </span>
          </label>
        ))}
      </div>
    </SettingsSection>
  );
}
