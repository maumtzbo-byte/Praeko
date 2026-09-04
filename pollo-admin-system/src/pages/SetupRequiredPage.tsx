import { DatabaseZap } from 'lucide-react'

export function SetupRequiredPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
        <DatabaseZap className="h-5 w-5" />
      </div>
      <div className="max-w-md">
        <p className="text-lg font-semibold">Falta conectar Supabase</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Este despliegue no tiene configuradas <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code> y{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code>. Agrégalas en las variables de
          entorno de tu proyecto (local: archivo <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> · Vercel: Project
          Settings → Environment Variables) y vuelve a desplegar. Ver <code className="rounded bg-muted px-1 py-0.5 text-xs">README.md</code>.
        </p>
      </div>
    </div>
  )
}
