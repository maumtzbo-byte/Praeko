import * as React from 'react'
import { Sparkles, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </CardContent>
    </Card>
  )
}
