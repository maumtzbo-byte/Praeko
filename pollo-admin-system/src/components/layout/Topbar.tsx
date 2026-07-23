import * as React from 'react'
import { Menu, LogOut, User, Settings } from 'lucide-react'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarBrand, SidebarNav } from '@/components/layout/Sidebar'
import { GlobalSearch } from '@/components/shared/GlobalSearch'
import { NotificationsPopover } from '@/components/shared/NotificationsPopover'
import { useAuth } from '@/context/AuthContext'
import { initials } from '@/lib/utils'

export function Topbar() {
  const { usuario, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <header className="glass sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border px-4 sm:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <VisuallyHidden.Root>
            <h2>Menú de navegación</h2>
          </VisuallyHidden.Root>
          <SidebarBrand />
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <GlobalSearch className="hidden sm:block" />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-accent">
              <Avatar className="h-7 w-7">
                <AvatarFallback>{usuario ? initials(usuario.nombre) : '?'}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium leading-tight">{usuario?.nombre}</span>
                <span className="block text-[11px] capitalize leading-tight text-muted-foreground">
                  {usuario?.rol?.nombre}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{usuario?.nombre}</p>
              <p className="text-xs font-normal text-muted-foreground">{usuario?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User /> Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings /> Preferencias
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
              <LogOut /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
