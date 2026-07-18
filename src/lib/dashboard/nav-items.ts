import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  FolderOpen,
  Images,
  Share2,
  Send,
  BarChart3,
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
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/generar-contenido", label: "Generar contenido", icon: Sparkles },
  { href: "/dashboard/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/dashboard/biblioteca", label: "Biblioteca multimedia", icon: FolderOpen },
  { href: "/dashboard/galeria", label: "Galería", icon: Images },
  { href: "/dashboard/redes-sociales", label: "Redes sociales", icon: Share2 },
  { href: "/dashboard/publicaciones", label: "Publicaciones programadas", icon: Send },
  { href: "/dashboard/analiticas", label: "Analíticas", icon: BarChart3 },
  { href: "/dashboard/ia-marketing", label: "IA de Marketing", icon: Bot },
  { href: "/dashboard/marca", label: "Marca", icon: Palette },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/facturacion", label: "Facturación", icon: CreditCard },
  { href: "/dashboard/plan", label: "Mi plan", icon: Gem },
  { href: "/dashboard/ayuda", label: "Ayuda", icon: LifeBuoy },
];
