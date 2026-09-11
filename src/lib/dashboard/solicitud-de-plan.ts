import { ligaWhatsapp } from "@/lib/contacto";

// No hay cobro en automático todavía (Stripe no está conectado) — en vez
// de un botón muerto de "Próximamente", esto manda una solicitud ya
// escrita a alguien que puede activar el plan a mano.
//
// Iba por correo a soporte@frames.com, un dominio que no es nuestro: o
// sea que el único botón para contratar dentro del panel no llegaba a
// ningún lado. Ahora va por WhatsApp, que es el canal que de verdad
// contestamos. Por eso el archivo y las funciones ya no se llaman
// "email".
export function ligaSolicitudDePlan(businessName: string, planDisplayName: string, priceUsd: number) {
  return ligaWhatsapp(
    `Hola, quiero activar el plan ${planDisplayName} ($${priceUsd} USD/mes) para mi negocio "${businessName}".`,
  );
}

/**
 * La versión para planes ajustados. Deletrea cada cantidad porque del otro
 * lado alguien tiene que capturarlas a mano en las columnas custom_* de la
 * suscripción — un mensaje que solo dijera "quiero un plan a la medida"
 * obligaría a una ida y vuelta para averiguar cuál.
 */
export function ligaSolicitudDePlanAMedida(
  businessName: string,
  selection: {
    videosPerMonth: number;
    videoMaxSeconds: number;
    imagesPerMonth: number;
    carouselsPerMonth: number;
  },
  priceCents: number,
) {
  const mensaje = [
    `Hola, quiero activar un plan a la medida para mi negocio "${businessName}":`,
    "",
    `• Videos al mes: ${selection.videosPerMonth}`,
    `• Duración por video: hasta ${selection.videoMaxSeconds} segundos`,
    `• Imágenes al mes: ${selection.imagesPerMonth}`,
    `• Carruseles al mes: ${selection.carouselsPerMonth}`,
    "",
    `Precio calculado: $${Math.round(priceCents / 100)} USD/mes.`,
  ].join("\n");
  return ligaWhatsapp(mensaje);
}
