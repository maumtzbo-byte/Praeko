import * as React from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error no controlado en la aplicación:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <div className="max-w-lg">
            <p className="text-lg font-semibold text-foreground">Ocurrió un error inesperado</p>
            <p className="mt-2 text-sm text-muted-foreground">
              La aplicación no pudo iniciar correctamente. Comparte este mensaje para ayudar a diagnosticarlo:
            </p>
            <pre className="mt-4 max-h-56 overflow-auto rounded-lg border border-border bg-muted p-3 text-left text-xs text-muted-foreground">
              {this.state.error.name}: {this.state.error.message}
            </pre>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
