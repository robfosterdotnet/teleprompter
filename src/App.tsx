import { useEffect, useState } from 'react'
import { TeleprompterView } from '@/views/teleprompter'
import { ScriptBuilderView } from '@/views/scriptBuilder'
import './App.css'

type Workspace = 'teleprompter' | 'builder'

interface WorkspaceOption {
  id: Workspace
  label: string
  description: string
}

const VIEW_STORAGE_KEY = 'teleprompter-workspace-view'
const workspaceOptions: WorkspaceOption[] = [
  { id: 'teleprompter', label: 'Teleprompter', description: 'Practice scripts & pacing' },
  { id: 'builder', label: 'AI Builder', description: 'Generate drafts with GPT-5-nano' },
]

function App() {
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    if (typeof window === 'undefined') return 'teleprompter'
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    return stored === 'builder' ? 'builder' : 'teleprompter'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(VIEW_STORAGE_KEY, workspace)
  }, [workspace])

  return (
    <div className="workspace-shell">
      <nav className="workspace-nav" aria-label="Workspace switcher">
        {workspaceOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={workspace === option.id ? 'active' : ''}
            aria-pressed={workspace === option.id}
            onClick={() => setWorkspace(option.id)}
          >
            <span>{option.label}</span>
            <small>{option.description}</small>
          </button>
        ))}
      </nav>
      {workspace === 'teleprompter' ? <TeleprompterView /> : <ScriptBuilderView />}
    </div>
  )
}

export default App
