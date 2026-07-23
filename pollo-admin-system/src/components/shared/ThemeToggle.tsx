import { Moon, Sun, SunMoon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme, type Theme } from '@/context/ThemeContext'

const NEXT_THEME: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const THEME_LABEL: Record<Theme, string> = {
  light: 'Tema claro',
  dark: 'Tema oscuro',
  system: 'Tema del sistema',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : SunMoon

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(NEXT_THEME[theme])}
      title={THEME_LABEL[theme]}
      aria-label={`Cambiar tema (actual: ${THEME_LABEL[theme]})`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
