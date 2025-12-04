import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTeleprompterStore } from '@/store/teleprompterStore'
import { resetTeleprompterStore } from '@/test/testUtils'
import { NotesEditor } from './NotesEditor'

describe('NotesEditor', () => {
  beforeEach(() => {
    resetTeleprompterStore()
  })

  it('saves notes for the active segment', async () => {
    const user = userEvent.setup()
    render(<NotesEditor />)

    const textarea = screen.getByPlaceholderText(/add private cues/i)
    await user.type(textarea, 'Remember to thank the crew')

    const firstSegment = useTeleprompterStore.getState().script.segments[0]
    expect(firstSegment.notes).toBe('Remember to thank the crew')
    expect(screen.getByText(new RegExp(firstSegment.title, 'i'))).toBeInTheDocument()
  })
})
