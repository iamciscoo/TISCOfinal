declare module 'jspdf-autotable'

interface AutoTableOptions {
  head?: string[][]
  body?: (string | number)[][]
  startY?: number
  theme?: 'striped' | 'grid' | 'plain'
  headStyles?: Record<string, unknown>
  bodyStyles?: Record<string, unknown>
  columnStyles?: Record<string | number, Record<string, unknown>>
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  didDrawPage?: (data: unknown) => void
  [key: string]: unknown
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number
    }
    autoTable: (options: AutoTableOptions) => jsPDF
  }
}
