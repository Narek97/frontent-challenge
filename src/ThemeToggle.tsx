import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from './lib/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
