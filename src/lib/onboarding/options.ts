import {
  Users,
  ShoppingCart,
  CalendarCheck,
  Megaphone,
  TrendingUp,
  Sparkles,
  Briefcase,
  Building2,
  ShoppingBag,
  UtensilsCrossed,
  Dumbbell,
  Scissors,
  HeartPulse,
  GraduationCap,
  Store,
  Megaphone as MarketingIcon,
} from "lucide-react";

/** Blends role and business type on purpose — "¿a qué te dedicas?" reads
 * more naturally to a small-business owner than a strict industry taxonomy,
 * and it's what actually determines how the AI should talk about the
 * business. Still stored in the same `industry` column as before. */
export const INDUSTRY_OPTIONS = [
  { value: "Dueño de negocio", label: "Dueño de negocio", icon: Briefcase },
  { value: "Asesor inmobiliario", label: "Asesor inmobiliario", icon: Building2 },
  { value: "E-commerce", label: "E-commerce", icon: ShoppingBag },
  { value: "Agencia de marketing", label: "Agencia de marketing", icon: MarketingIcon },
  { value: "Restaurante o cafetería", label: "Restaurante o cafetería", icon: UtensilsCrossed },
  { value: "Gimnasio o estudio boutique", label: "Gimnasio o estudio boutique", icon: Dumbbell },
  { value: "Belleza y estética", label: "Belleza y estética", icon: Scissors },
  { value: "Salud y bienestar", label: "Salud y bienestar", icon: HeartPulse },
  { value: "Servicios profesionales", label: "Servicios profesionales", icon: Users },
  { value: "Educación", label: "Educación", icon: GraduationCap },
  { value: "Retail o tienda", label: "Retail o tienda", icon: Store },
  { value: "Otro", label: "Otro", icon: Sparkles },
] as const;

export const LANGUAGE_OPTIONS = ["Español", "Inglés", "Español e inglés"];

/** Fixed list kept short on purpose — these are the markets Frames
 * actually targets today (Mexico) plus the one explicitly planned next
 * (Estados Unidos). "Otro" reveals a free-text field in BusinessInfoStep
 * instead of forcing every possible country into this dropdown. */
export const COUNTRY_OPTIONS = ["México", "Estados Unidos"];

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
