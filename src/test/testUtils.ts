import { useScriptBuilderStore } from '@/store/scriptBuilderStore'
import { useScriptLibraryStore } from '@/store/scriptLibraryStore'
import { useTeleprompterStore } from '@/store/teleprompterStore'

export const resetTeleprompterStore = () => {
  useTeleprompterStore.getState().reset()
  useTeleprompterStore.persist?.clearStorage?.()
  window.localStorage.clear()
}

export const resetScriptBuilderStore = () => {
  useScriptBuilderStore.getState().reset()
}

export const resetScriptLibraryStore = () => {
  useScriptLibraryStore.getState().clearLibrary()
  useScriptLibraryStore.persist?.clearStorage?.()
}
