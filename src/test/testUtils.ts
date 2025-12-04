import { useTeleprompterStore } from '@/store/teleprompterStore'

export const resetTeleprompterStore = () => {
  useTeleprompterStore.getState().reset()
  useTeleprompterStore.persist?.clearStorage?.()
  window.localStorage.clear()
}
