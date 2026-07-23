import * as React from 'react'
import { Search } from 'lucide-react'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from '@/components/shared/GlobalSearch'

export function MobileSearchDialog() {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Search className="h-[18px] w-[18px]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-6 translate-y-0 gap-3 sm:hidden">
        <VisuallyHidden.Root>
          <DialogTitle>Buscar</DialogTitle>
        </VisuallyHidden.Root>
        <GlobalSearch className="max-w-none" autoFocus onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
