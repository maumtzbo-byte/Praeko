import * as React from 'react'
import { Sparkles, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GuiaPasoItem } from '@/components/shared/GuiaPasoItem'
import { getGuiaPasos } from '@/lib/guia-rapida'
import { useAuth } from '@/context/AuthContext'

const STORAGE_KEY = 'pollo-admin-guia-oculta'

export function QuickStartCard() {
  const { usuario } = useAuth()
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== '1')
  }, [])

  if (!visible) return null

  const pasos = getGuiaPasos(usuario?.rol?.clave)

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">¿Cómo funciona Pollo Admin?</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 h-8 w-8 shrink-0"
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, '1')
              setVisible(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4">
          {pasos.map((paso, i) => (
            <GuiaPasoItem key={paso.titulo} paso={paso} numero={i + 1} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
