import * as React from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { getGuiaPasos } from '@/lib/guia-rapida'
import { useAuth } from '@/context/AuthContext'

export function HelpDialog() {
  const { usuario } = useAuth()
  const [open, setOpen] = React.useState(false)
  const pasos = getGuiaPasos(usuario?.rol?.clave)

  return (
    <>
      <Button variant="ghost" size="icon" title="Cómo funciona" aria-label="Cómo funciona" onClick={() => setOpen(true)}>
        <HelpCircle className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cómo funciona Pollo Admin?</DialogTitle>
            <DialogDescription>Guía rápida para no perderte.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {pasos.map((paso) => (
              <div key={paso.titulo} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <paso.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{paso.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{paso.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
