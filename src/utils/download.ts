const isBrowser = () => typeof window !== 'undefined'

export const downloadText = (filename: string, contents: string, mimeType: string) => {
  if (!isBrowser()) return
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
