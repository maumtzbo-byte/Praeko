import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { useProductos } from '@/hooks/use-productos'
import { useSucursales } from '@/hooks/use-sucursales'
import { usePedidos } from '@/hooks/use-pedidos'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  to: string
}

export function GlobalSearch({ className }: { className?: string }) {
  const [query, setQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const debounced = useDebounce(query, 200)
  const navigate = useNavigate()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const { data: productos = [] } = useProductos()
  const { data: sucursales = [] } = useSucursales()
  const { data: pedidos = [] } = usePedidos()

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const results = React.useMemo<SearchResult[]>(() => {
    const term = debounced.trim().toLowerCase()
    if (term.length < 2) return []

    const productoResults: SearchResult[] = productos
      .filter((p) => p.nombre.toLowerCase().includes(term))
      .slice(0, 4)
      .map((p) => ({ id: p.id, title: p.nombre, subtitle: 'Producto', to: '/productos' }))

    const sucursalResults: SearchResult[] = sucursales
      .filter((s) => s.nombre.toLowerCase().includes(term) || s.direccion.toLowerCase().includes(term))
      .slice(0, 4)
      .map((s) => ({ id: s.id, title: s.nombre, subtitle: 'Sucursal', to: '/sucursales' }))

    const pedidoResults: SearchResult[] = pedidos
      .filter((p) => p.producto.nombre.toLowerCase().includes(term) || p.sucursal.nombre.toLowerCase().includes(term))
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        title: `Pedido: ${p.producto.nombre}`,
        subtitle: `${p.sucursal.nombre} · ${p.estado}`,
        to: '/pedidos',
      }))

    return [...productoResults, ...sucursalResults, ...pedidoResults].slice(0, 10)
  }, [debounced, productos, sucursales, pedidos])

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-sm', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar productos, sucursales, pedidos…"
        className="h-9 bg-muted/50 pl-9 pr-8"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && debounced.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin resultados para “{debounced}”</p>
          ) : (
            <ul className="py-1">
              {results.map((r) => (
                <li key={`${r.subtitle}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(r.to)
                      setOpen(false)
                      setQuery('')
                    }}
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
