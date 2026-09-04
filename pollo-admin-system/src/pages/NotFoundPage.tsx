import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-semibold">Página no encontrada</p>
        <p className="mt-1 text-sm text-muted-foreground">La ruta que buscas no existe o fue movida.</p>
      </div>
      <Button asChild>
        <Link to="/dashboard">Volver al dashboard</Link>
      </Button>
    </div>
  )
}
