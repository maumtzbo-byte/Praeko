import { Users, ShoppingCart, CalendarCheck, Megaphone, TrendingUp, Sparkles } from "lucide-react";

export const INDUSTRY_OPTIONS = [
  "Gimnasio o estudio boutique",
  "Restaurante o cafetería",
  "Belleza y estética",
  "Retail o tienda",
  "Salud y bienestar",
  "Servicios profesionales",
  "Educación",
  "Otro",
];

export const LANGUAGE_OPTIONS = ["Español", "Inglés", "Español e inglés"];

export const GOAL_OPTIONS = [
  { value: "conseguir_clientes", label: "Conseguir más clientes", icon: Users },
  { value: "generar_ventas", label: "Generar ventas", icon: ShoppingCart },
  { value: "reservas", label: "Conseguir reservas", icon: CalendarCheck },
  { value: "reconocimiento", label: "Generar reconocimiento", icon: Megaphone },
  { value: "crecer_redes", label: "Crecer en redes sociales", icon: TrendingUp },
  { value: "otro", label: "Otro", icon: Sparkles },
];

export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "@tunegocio" },
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/tunegocio" },
  { key: "tiktok", label: "TikTok", placeholder: "@tunegocio" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/company/tunegocio" },
  { key: "x", label: "X", placeholder: "@tunegocio" },
  { key: "youtube", label: "YouTube", placeholder: "youtube.com/@tunegocio" },
] as const;
