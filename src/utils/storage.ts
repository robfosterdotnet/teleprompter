import type { Script } from '@/types/script'

export const SCRIPT_DRAFT_STORAGE_KEY = 'teleprompter-script-draft'

const isBrowser = () => typeof window !== 'undefined'

export const loadScriptDraft = (): Script | null => {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(SCRIPT_DRAFT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Script) : null
  } catch {
    return null
  }
}

export const saveScriptDraft = (script: Script) => {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(SCRIPT_DRAFT_STORAGE_KEY, JSON.stringify(script))
  } catch {
    // Swallow quota errors—autosave is a best-effort cache.
  }
}
