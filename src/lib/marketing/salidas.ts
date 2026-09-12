"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

/** Los botones que mandan a WhatsApp. Igual que el CHECK de la tabla
 *  (ver 0031_salidas_a_whatsapp.sql). */
const BOTONES = ["muestra", "cotizacion"] as const;
export type BotonDeSalida = (typeof BOTONES)[number];

/**
 * Registra que alguien se fue por el botón de WhatsApp.
 *
 * Es un contador, no un rastreador: no guarda nada de la persona. Ver la
 * migración para el porqué.
 *
 * Nunca lanza ni devuelve error, y es deliberado. Lo llama un onClick
 * justo antes de que se abra WhatsApp; si algo falla del lado del
 * servidor, lo que NO puede pasar es que eso se note en la pantalla del
 * prospecto. Perder un renglón de estadística es gratis. Estorbarle a
 * alguien que iba a escribir, no.
 */
export async function registrarSalida(datos: {
  boton: unknown;
  origen: unknown;
  ruta: unknown;
}): Promise<void> {
  const { boton, origen, ruta } = datos;

  if (typeof boton !== "string" || !(BOTONES as readonly string[]).includes(boton)) {
    return;
  }

  const texto = (valor: unknown, tope: number): string | null =>
    typeof valor === "string" && valor.trim().length > 0
      ? valor.trim().slice(0, tope)
      : null;

  try {
    await createServiceRoleClient()
      .from("whatsapp_exits")
      .insert({ boton, origen: texto(origen, 60), ruta: texto(ruta, 120) });
  } catch (err) {
    console.error("registrarSalida falló", err);
  }
}
