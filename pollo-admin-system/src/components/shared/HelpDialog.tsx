import * as React from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { GuiaPasoItem } from '@/components/shared/GuiaPasoItem'
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
            <DialogTitle>¿Cómo funciona Pimpollo?</DialogTitle>
            <DialogDescription>Guía rápida para no perderte.</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
            {pasos.map((paso, i) => (
              <GuiaPasoItem key={paso.titulo} paso={paso} numero={i + 1} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
