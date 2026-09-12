"use server";

import { revalidatePath } from "next/cache";

import { esOperador } from "@/lib/operacion/acceso";
import { esEstado } from "@/lib/operacion/prospectos";
import { createServiceRoleClient } from "@/lib/supabase/server";

type Resultado = { success: true } | { success: false; error: string };

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mueve un prospecto de estado.
 *
 * Con service-role porque `leads` tiene RLS y cero políticas. La
 * autorización la hace `esOperador` ANTES, no la base — y por eso es lo
 * primero que corre: sin esa comprobación, esta función sería una API
 * abierta para reescribir el embudo completo. Una server action es un
 * endpoint público aunque el botón que la llama esté detrás de una
 * pantalla que nadie puede abrir.
 */
export async function moverProspecto(datos: {
  id: unknown;
  estado: unknown;
}): Promise<Resultado> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { id, estado } = datos;
  if (typeof id !== "string" || !ES_UUID.test(id)) {
    return { success: false, error: "Prospecto no válido." };
  }
  if (typeof estado !== "string" || !esEstado(estado)) {
    return { success: false, error: "Estado no válido." };
  }

  const { error } = await createServiceRoleClient()
    .from("leads")
    .update({ estado })
    .eq("id", id);

  if (error) {
    console.error("moverProspecto falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/prospectos");
  return { success: true };
}

/** Guarda una nota sobre el prospecto. Texto libre y a mano: con diez
 *  prospectos, un campo de notas gana a cualquier CRM. */
export async function anotarProspecto(datos: {
  id: unknown;
  notas: unknown;
}): Promise<Resultado> {
  if (!(await esOperador())) return { success: false, error: "Sin acceso." };

  const { id, notas } = datos;
  if (typeof id !== "string" || !ES_UUID.test(id)) {
    return { success: false, error: "Prospecto no válido." };
  }

  const texto = typeof notas === "string" ? notas.trim().slice(0, 2000) : "";

  const { error } = await createServiceRoleClient()
    .from("leads")
    .update({ notas: texto || null })
    .eq("id", id);

  if (error) {
    console.error("anotarProspecto falló", error);
    return { success: false, error: "No se pudo guardar." };
  }

  revalidatePath("/prospectos");
  return { success: true };
}
