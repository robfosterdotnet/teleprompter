import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import App from './App'

describe('App accessibility', () => {
  it('renders key regions with accessible names', () => {
    render(<App />)
    expect(screen.getByLabelText(/script preview/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/presenter controls/i)).toBeInTheDocument()
  })

  it('has no detectable axe violations in default theme', async () => {
    const { container } = render(<App />)
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    })
    expect(results.violations).toHaveLength(0)
  })
})
