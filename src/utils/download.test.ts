import { describe, expect, it, vi, afterEach } from 'vitest'
import { downloadText } from './download'

describe('downloadText', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates an anchor element and triggers a click in the browser', () => {
    const blobUrl = 'blob:mock-url'
    const anchor = document.createElement('a')
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => undefined)
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(blobUrl)
    const revokeObjectUrlSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined)
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    downloadText('notes.txt', 'hello world', 'text/plain')

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1)
    expect(appendSpy).toHaveBeenCalledWith(anchor)
    expect(clickSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith(anchor)
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith(blobUrl)
    expect(anchor.download).toBe('notes.txt')
    expect(anchor.href).toBe(blobUrl)
  })

  it('exits early when window is unavailable', () => {
    const createSpy = vi.spyOn(document, 'createElement')
    vi.stubGlobal('window', undefined as unknown as Window)

    downloadText('noop.txt', 'noop', 'text/plain')

    expect(createSpy).not.toHaveBeenCalled()
  })
})
