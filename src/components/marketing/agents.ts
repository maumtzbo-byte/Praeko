import { Compass, Radar, Wand2, ShieldCheck, Send, MessageCircle, BarChart3, type LucideIcon } from "lucide-react";

/**
 * Los siete agentes, en un módulo aparte porque los usa más de una
 * sección: la fila y el chat de "Tu nuevo equipo", y la línea de
 * producción del hero. Duplicar las rutas de los renders en cada una es
 * cómo se termina con una sección mostrando un personaje que la otra ya
 * no tiene.
 *
 * Cada uno habla en primera persona de lo que realmente hace hoy.
 *
 * Los colores son una familia derivada del azul de marca (más un ámbar
 * para el único que sirve para frenar cosas), no siete colores sueltos.
 */
export interface Agent {
  id: string;
  /** Nombre corto para el avatar. */
  name: string;
  /** Título completo tal como se dice. Explícito y no "Agente de " + name,
   * porque ese prefijo produce "Agente de Revisor de Marca". */
  fullName: string;
  icon: LucideIcon;
  color: string;
  /** Render 3D del personaje en `public/agentes/<id>.webp`. El objeto que
   * trae cada uno es lo que lo identifica a simple vista (laptop, cámara,
   * celular…), así que la pose no es decorativa: es el ícono. Si el archivo
   * todavía no existe, la sección cae al ícono de Lucide y no se rompe. */
  image: string;
  messages: string[];
}

export const AGENTS: Agent[] = [
  {
    id: "estrategia",
    name: "Estrategia",
    fullName: "Agente de Estrategia",
    icon: Compass,
    color: "#2f6fb0",
    image: "/agentes/estrategia.webp",
    messages: [
      "Yo decido qué se publica y qué día.",
      "Leo lo que contestaste de tu marca: tu tono, qué vendes, a quién. Con eso armo el plan del mes completo, con el guion de cada pieza ya escrito.",
      "Si tu plan trae 8 videos, reparto esos 8 donde más sirven. No relleno el calendario por llenarlo.",
    ],
  },
  {
    id: "tendencias",
    name: "Tendencias",
    fullName: "Agente de Tendencias",
    icon: Radar,
    color: "#3d8f9e",
    image: "/agentes/tendencias.webp",
    messages: [
      "Antes de que se escriba nada, yo investigo.",
      "Busco en internet qué tipo de contenido está funcionando ahora mismo para marcas como la tuya.",
      "Y traigo el calendario que importa: Buen Fin, Día de las Madres, la quincena. Si vendes en Estados Unidos, cambio a Black Friday y Thanksgiving.",
    ],
  },
  {
    id: "creativo",
    name: "Creativo",
    fullName: "Agente Creativo",
    icon: Wand2,
    color: "#6a5fb0",
    image: "/agentes/creativo.webp",
    messages: [
      "Yo lo produzco.",
      "Tomo el guion y genero el video o la imagen de verdad. No un borrador, ni una plantilla que tengas que rellenar tú.",
      "Tu producto no lo invento: uso la foto que subiste como referencia, y genero la escena alrededor. Sale con su forma y su etiqueta, no un parecido.",
    ],
  },
  {
    id: "revisor",
    name: "Revisor de Marca",
    fullName: "Agente Revisor de Marca",
    icon: ShieldCheck,
    color: "#b08a3d",
    image: "/agentes/revisor.webp",
    messages: [
      "Yo reviso antes que tú.",
      "Cada pieza pasa por mí: que suene a tu marca, que no diga algo que no debería, que el gancho no sea genérico.",
      "Si algo no pasa, lo marco y no llega a publicarse sin que tú lo veas primero.",
    ],
  },
  {
    id: "publicacion",
    name: "Publicación",
    fullName: "Agente de Publicación",
    icon: Send,
    color: "#2f8f6b",
    image: "/agentes/publicacion.webp",
    messages: [
      "Yo la subo.",
      "Publico en Instagram, Facebook o TikTok a la hora en que tu gente está despierta y comprando, no a la hora en que se acordó alguien.",
      "Tú apruebas una vez; de ahí en adelante me encargo yo.",
    ],
  },
  {
    id: "respuestas",
    name: "Respuestas",
    fullName: "Agente de Respuestas",
    icon: MessageCircle,
    color: "#4a7fd0",
    image: "/agentes/respuestas.webp",
    messages: [
      "Yo contesto.",
      "Cuando alguien pregunta precio, envío o de qué está hecho en tus comentarios o mensajes, respondo con la información real de tu marca.",
      "Si la pregunta se pone seria, te la paso a ti en vez de inventar una respuesta.",
    ],
  },
  {
    id: "resultados",
    name: "Resultados",
    fullName: "Agente de Resultados",
    icon: BarChart3,
    color: "#4f6a86",
    image: "/agentes/resultados.webp",
    messages: [
      "Yo mido.",
      "Traigo los números reales de cada publicación: alcance, likes, comentarios, seguidores nuevos.",
      "Y te digo qué funcionó de verdad, para que el plan del mes que entra salga mejor que este.",
    ],
  },
];
