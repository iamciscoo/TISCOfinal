/**
 * TypeScript definitions for jspdf-autotable
 */

import 'jspdf'

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number
    }
    autoTable: (options: UserOptions) => jsPDF
  }
}

export interface UserOptions {
  head?: RowInput[]
  body?: RowInput[]
  foot?: RowInput[]
  startY?: number
  margin?: MarginOptions
  pageBreak?: 'auto' | 'avoid' | 'always'
  rowPageBreak?: 'auto' | 'avoid'
  tableWidth?: 'auto' | 'wrap' | number
  showHead?: 'everyPage' | 'firstPage' | 'never'
  showFoot?: 'everyPage' | 'lastPage' | 'never'
  tableLineColor?: number | number[]
  tableLineWidth?: number
  theme?: 'striped' | 'grid' | 'plain'
  
  headStyles?: StyleOptions
  bodyStyles?: StyleOptions
  footStyles?: StyleOptions
  alternateRowStyles?: StyleOptions
  columnStyles?: { [key: string]: StyleOptions }
  
  didDrawPage?: (data: CellHookData) => void
  didParseCell?: (data: CellHookData) => void
  willDrawCell?: (data: CellHookData) => void
  didDrawCell?: (data: CellHookData) => void
}

export interface StyleOptions {
  font?: string
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic'
  fontSize?: number
  cellWidth?: 'auto' | 'wrap' | number
  cellPadding?: number | Padding
  halign?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
  fillColor?: number | number[] | string | false
  textColor?: number | number[] | string
  lineColor?: number | number[] | string
  lineWidth?: number
  minCellHeight?: number
  minCellWidth?: number
}

export interface MarginOptions {
  top?: number
  right?: number
  bottom?: number
  left?: number
  horizontal?: number
  vertical?: number
}

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface CellHookData {
  cell: Cell
  row: Row
  column: Column
  section: 'head' | 'body' | 'foot'
  table: Table
}

export interface Cell {
  raw: string | number
  text: string[]
  styles: StyleOptions
  x: number
  y: number
  width: number
  height: number
  contentWidth: number
  contentHeight: number
  colSpan: number
  rowSpan: number
}

export interface Row {
  raw: RowInput
  index: number
  cells: { [key: string]: Cell }
  section: 'head' | 'body' | 'foot'
  height: number
  y: number
}

export interface Column {
  dataKey: string | number
  index: number
  width: number
}

export interface Table {
  rows: Row[]
  columns: Column[]
  head: Row[]
  body: Row[]
  foot: Row[]
}

export type RowInput = string[] | number[] | { [key: string]: string | number }
