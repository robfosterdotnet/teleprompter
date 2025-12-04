declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const GlobalWorkerOptions: { workerSrc: string }
  export function getDocument(options: { data: Uint8Array; useSystemFonts?: boolean }): {
    promise: Promise<{
      numPages: number
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{
          items: { str?: string }[]
        }>
      }>
      destroy: () => Promise<void>
    }>
  }
}
