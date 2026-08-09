import {
  LayoutDashboard,
  Sparkles,
  Megaphone,
  CalendarDays,
  Images,
  Share2,
  Send,
  Bot,
  Palette,
  Settings,
  CreditCard,
  Gem,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Flags a section that isn't built yet (still a ComingSoonPage) — shown
   * as a small "Pronto" tag in the nav so visitors know before they click,
   * instead of finding out only after landing on an empty page. */
  comingSoon?: boolean;
}

export interface NavGroup {
  /** Omitted for the standalone "Dashboard" link at the top — a label on a
   * single-item group would just repeat what the link itself already says. */
  label?: string;
  items: NavItem[];
}

/** Grouped instead of one flat 11-item list — the old version read as a
 * wall of text with no hierarchy. Three groups map to how a business owner
 * actually thinks about the product: plan/make/publish content, grow reach,
 * keep the AI on-brand. */
export const PRIMARY_NAV_GROUPS: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Contenido",
    items: [
      { href: "/dashboard/generar-contenido", label: "Generar contenido", icon: Sparkles },
      { href: "/dashboard/campanas", label: "Campañas", icon: Megaphone },
      { href: "/dashboard/calendario", label: "Calendario", icon: CalendarDays },
      { href: "/dashboard/publicaciones", label: "Publicaciones programadas", icon: Send },
    ],
  },
  {
    label: "Crecimiento",
    items: [
      { href: "/dashboard/redes-sociales", label: "Redes sociales", icon: Share2 },
      { href: "/dashboard/galeria", label: "Galería", icon: Images },
    ],
  },
  {
    label: "Marca e IA",
    items: [
      { href: "/dashboard/ia-marketing", label: "IA de Marketing", icon: Bot },
      { href: "/dashboard/marca", label: "Marca", icon: Palette },
    ],
  },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/facturacion", label: "Facturación", icon: CreditCard },
  { href: "/dashboard/plan", label: "Mi plan", icon: Gem },
  { href: "/dashboard/ayuda", label: "Ayuda", icon: LifeBuoy },
];
