import type { ThemeName } from '@/types/teleprompter'
import { useTeleprompterStore } from '@/store/teleprompterStore'

const THEMES: { label: string; value: ThemeName }[] = [
  { label: 'Default', value: 'default' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'High contrast', value: 'high-contrast' },
]

export const ThemeSwitcher = () => {
  const activeTheme = useTeleprompterStore((state) => state.preferences.theme)
  const setPreferences = useTeleprompterStore((state) => state.setPreferences)

  return (
    <section className="theme-switcher" aria-label="Theme selection">
      <p className="segment-label">Theme</p>
      <div className="theme-button-row">
        {THEMES.map((theme) => (
          <button
            key={theme.value}
            type="button"
            onClick={() => setPreferences({ theme: theme.value })}
            aria-pressed={theme.value === activeTheme}
          >
            {theme.label}
          </button>
        ))}
      </div>
    </section>
  )
}
