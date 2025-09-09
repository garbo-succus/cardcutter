import { create } from 'zustand'

interface AppState {
  mode: 'single' | 'separate'
  file1: File | null
  numPages1: number
  file2: File | null
  numPages2: number
  columns: number
  rows: number
  startPage: number
  finishPage: number | null
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
  columnSpacing: number
  rowSpacing: number
  rotation: number
  outlineColor: string
  dpi: number
  templateName: string
  marginUnit: 'mm' | 'inches'
  pageDimensions: {[key: string]: {width: number, height: number}}
  previewCardNumber: number

  update: <K extends keyof Omit<AppState, 'update'>>(key: K, value: AppState[K]) => void
  setMode: (mode: 'single' | 'separate') => void
  setFile1: (file: File | null) => void
  setNumPages1: (numPages: number) => void
  setFile2: (file: File | null) => void
  setNumPages2: (numPages: number) => void
  setColumns: (columns: number) => void
  setRows: (rows: number) => void
  setStartPage: (page: number) => void
  setFinishPage: (page: number | null) => void
  setMarginLeft: (margin: number) => void
  setMarginRight: (margin: number) => void
  setMarginTop: (margin: number) => void
  setMarginBottom: (margin: number) => void
  setColumnSpacing: (spacing: number) => void
  setRowSpacing: (spacing: number) => void
  setRotation: (rotation: number) => void
  setOutlineColor: (color: string) => void
  setDpi: (dpi: number) => void
  setTemplateName: (name: string) => void
  setMarginUnit: (unit: 'mm' | 'inches') => void
  setPageDimensions: (dimensions: {[key: string]: {width: number, height: number}}) => void
  setPreviewCardNumber: (cardNumber: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'single',
  file1: null,
  numPages1: 0,
  file2: null,
  numPages2: 0,
  columns: 4,
  rows: 2,
  startPage: 1,
  finishPage: null,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginBottom: 0,
  columnSpacing: 0,
  rowSpacing: 0,
  rotation: 0,
  outlineColor: 'red',
  dpi: 300,
  templateName: 'mycard',
  marginUnit: 'mm',
  pageDimensions: {},
  previewCardNumber: 1,

  update: (key, value) => set({ [key]: value } as any),
  setMode: (mode) => set({ mode }),
  setFile1: (file1) => set({ file1 }),
  setNumPages1: (numPages1) => set({ numPages1 }),
  setFile2: (file2) => set({ file2 }),
  setNumPages2: (numPages2) => set({ numPages2 }),
  setColumns: (columns) => set({ columns }),
  setRows: (rows) => set({ rows }),
  setStartPage: (startPage) => set({ startPage }),
  setFinishPage: (finishPage) => set({ finishPage }),
  setMarginLeft: (marginLeft) => set({ marginLeft }),
  setMarginRight: (marginRight) => set({ marginRight }),
  setMarginTop: (marginTop) => set({ marginTop }),
  setMarginBottom: (marginBottom) => set({ marginBottom }),
  setColumnSpacing: (columnSpacing) => set({ columnSpacing }),
  setRowSpacing: (rowSpacing) => set({ rowSpacing }),
  setRotation: (rotation) => set({ rotation }),
  setOutlineColor: (outlineColor) => set({ outlineColor }),
  setDpi: (dpi) => set({ dpi }),
  setTemplateName: (templateName) => set({ templateName }),
  setMarginUnit: (marginUnit) => set({ marginUnit }),
  setPageDimensions: (pageDimensions) => set({ pageDimensions }),
  setPreviewCardNumber: (previewCardNumber) => set({ previewCardNumber }),
}))