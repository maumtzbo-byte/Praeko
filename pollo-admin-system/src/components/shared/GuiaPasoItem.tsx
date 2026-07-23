import type { GuiaPaso } from '@/lib/guia-rapida'

export function GuiaPasoItem({ paso, numero }: { paso: GuiaPaso; numero: number }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {numero}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <paso.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-sm font-medium">{paso.titulo}</p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{paso.texto}</p>
      </div>
    </div>
  )
}
