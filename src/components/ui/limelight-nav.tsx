"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Bookmark, PlusCircle, User, Settings, type LucideIcon } from "lucide-react";

export interface LimelightNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const DEFAULT_ITEMS: LimelightNavItem[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "bookmark", label: "Guardados", icon: Bookmark },
  { id: "add", label: "Crear", icon: PlusCircle },
  { id: "user", label: "Perfil", icon: User },
  { id: "settings", label: "Ajustes", icon: Settings },
];

const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

export default function LimelightNav({
  items = DEFAULT_ITEMS,
  defaultActiveId,
  onChange,
  className,
}: {
  items?: LimelightNavItem[];
  defaultActiveId?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const [activeId, setActiveId] = useState(defaultActiveId ?? items[0]?.id);

  function handleSelect(id: string) {
    if (id === activeId) return;
    setActiveId(id);
    onChange?.(id);
  }

  return (
    <nav
      aria-label="Navegación principal"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 ${className ?? ""}`}
    >
      <ul className="flex items-center gap-1 rounded-full border border-white/10 bg-black/70 px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:gap-2 sm:px-3">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className="relative flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14"
              >
                {isActive && (
                  <>
                    {/* The lamp: a tight, glowing white segment above the item —
                        the light "source" the beam below appears to pour from. */}
                    <motion.span
                      layoutId="limelight-bar"
                      transition={SPRING}
                      className="pointer-events-none absolute -top-2 left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-white"
                      style={{
                        boxShadow:
                          "0 0 6px 2px rgba(255,255,255,0.95), 0 0 18px 6px rgba(255,255,255,0.55), 0 0 34px 10px rgba(255,255,255,0.25)",
                      }}
                    />
                    {/* The beam: a trapezoid that's narrow at the lamp and flares
                        outward as it falls, so it visually envelops the icon
                        beneath it — a real conic gradient can't easily fake this
                        shape, so clip-path does the cone and the gradient does
                        the fade-to-transparent. */}
                    <motion.span
                      layoutId="limelight-beam"
                      transition={SPRING}
                      className="pointer-events-none absolute -top-1 left-1/2 h-16 w-14 -translate-x-1/2 blur-[3px] sm:h-[4.5rem] sm:w-16"
                      style={{
                        clipPath: "polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)",
                        background:
                          "linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 55%, rgba(255,255,255,0) 100%)",
                      }}
                    />
                  </>
                )}
                <Icon
                  strokeWidth={1.75}
                  className={`relative h-5 w-5 transition-all duration-200 sm:h-6 sm:w-6 ${
                    isActive
                      ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.85)]"
                      : "text-zinc-500 opacity-70 hover:text-zinc-300 hover:opacity-100"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
