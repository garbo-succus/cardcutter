import { create } from 'zustand'

interface AppState {
  mode: 'single' | 'separate'
  file1: File | null
  numPages1: number
  file2: File | null
  numPages2: number
  columns: number
  rows: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
  rotation: number
  outlineColor: string
  marginUnit: 'mm' | 'inches'
  pageDimensions: {[key: string]: {width: number, height: number}}

  setMode: (mode: 'single' | 'separate') => void
  setFile1: (file: File | null) => void
  setNumPages1: (numPages: number) => void
  setFile2: (file: File | null) => void
  setNumPages2: (numPages: number) => void
  setColumns: (columns: number) => void
  setRows: (rows: number) => void
  setMarginLeft: (margin: number) => void
  setMarginRight: (margin: number) => void
  setMarginTop: (margin: number) => void
  setMarginBottom: (margin: number) => void
  setRotation: (rotation: number) => void
  setOutlineColor: (color: string) => void
  setMarginUnit: (unit: 'mm' | 'inches') => void
  setPageDimensions: (dimensions: {[key: string]: {width: number, height: number}}) => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'single',
  file1: null,
  numPages1: 0,
  file2: null,
  numPages2: 0,
  columns: 4,
  rows: 2,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginBottom: 0,
  rotation: 0,
  outlineColor: 'red',
  marginUnit: 'mm',
  pageDimensions: {},

  setMode: (mode) => set({ mode }),
  setFile1: (file1) => set({ file1 }),
  setNumPages1: (numPages1) => set({ numPages1 }),
  setFile2: (file2) => set({ file2 }),
  setNumPages2: (numPages2) => set({ numPages2 }),
  setColumns: (columns) => set({ columns }),
  setRows: (rows) => set({ rows }),
  setMarginLeft: (marginLeft) => set({ marginLeft }),
  setMarginRight: (marginRight) => set({ marginRight }),
  setMarginTop: (marginTop) => set({ marginTop }),
  setMarginBottom: (marginBottom) => set({ marginBottom }),
  setRotation: (rotation) => set({ rotation }),
  setOutlineColor: (outlineColor) => set({ outlineColor }),
  setMarginUnit: (marginUnit) => set({ marginUnit }),
  setPageDimensions: (pageDimensions) => set({ pageDimensions }),
}))