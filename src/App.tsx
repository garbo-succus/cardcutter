import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useAppStore } from './store'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CardSizeProps {
  columns: number
  rows: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
  columnSpacing: number
  rowSpacing: number
  dpi: number
  pageDimensions: {[key: string]: {width: number, height: number}}
}

function CardSize({ columns, rows, marginLeft, marginRight, marginTop, marginBottom, columnSpacing, rowSpacing, dpi, pageDimensions }: CardSizeProps) {
  // Check if we have any page dimensions loaded
  const hasPageDimensions = Object.keys(pageDimensions).length > 0
  
  if (!hasPageDimensions) {
    return (
      <span>
        Card size: undefined
      </span>
    )
  }

  // Calculate card size based on current settings
  const calculateCardSize = () => {
    // Get the first available page dimensions
    const firstPageKey = Object.keys(pageDimensions)[0]
    const pageWidth = pageDimensions[firstPageKey].width
    const pageHeight = pageDimensions[firstPageKey].height
    
    const mmToPixels = (mm: number) => mm * (72 / 25.4)
    const pixelsToMm = (pixels: number) => pixels / (72 / 25.4)
    const mmToInches = (mm: number) => mm / 25.4
    
    const marginLeftPx = mmToPixels(marginLeft)
    const marginRightPx = mmToPixels(marginRight)
    const marginTopPx = mmToPixels(marginTop)
    const marginBottomPx = mmToPixels(marginBottom)
    const columnSpacingPx = mmToPixels(columnSpacing)
    const rowSpacingPx = mmToPixels(rowSpacing)
    
    const totalColumnSpacing = columnSpacingPx * (columns - 1)
    const totalRowSpacing = rowSpacingPx * (rows - 1)
    
    const availableWidth = pageWidth - marginLeftPx - marginRightPx - totalColumnSpacing
    const availableHeight = pageHeight - marginTopPx - marginBottomPx - totalRowSpacing
    
    const cardWidthPx = availableWidth / columns
    const cardHeightPx = availableHeight / rows
    
    const cardWidthMm = pixelsToMm(cardWidthPx)
    const cardHeightMm = pixelsToMm(cardHeightPx)
    const cardWidthIn = mmToInches(cardWidthMm)
    const cardHeightIn = mmToInches(cardHeightMm)
    
    // Calculate pixel dimensions at specified DPI
    const cardWidthPixels = Math.round(cardWidthIn * dpi)
    const cardHeightPixels = Math.round(cardHeightIn * dpi)
    
    return {
      widthMm: Math.round(cardWidthMm * 10) / 10,
      heightMm: Math.round(cardHeightMm * 10) / 10,
      widthIn: Math.round(cardWidthIn * 100) / 100,
      heightIn: Math.round(cardHeightIn * 100) / 100,
      widthPixels: cardWidthPixels,
      heightPixels: cardHeightPixels
    }
  }

  const cardSize = calculateCardSize()

  return (
    <span>
      Card size: {cardSize.widthMm}×{cardSize.heightMm}mm; {cardSize.widthIn}×{cardSize.heightIn}"; {cardSize.widthPixels}×{cardSize.heightPixels} pixels
    </span>
  )
}

interface CardPreviewProps {
  cardNumber: number
  mode: 'single' | 'separate'
  file1: File | null
  file2: File | null
  columns: number
  rows: number
  startPage: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
  columnSpacing: number
  rowSpacing: number
  dpi: number
  pageDimensions: {[key: string]: {width: number, height: number}}
}

function CardPreview({ cardNumber, mode, file1, file2, columns, rows, startPage, marginLeft, marginRight, marginTop, marginBottom, columnSpacing, rowSpacing, dpi, pageDimensions }: CardPreviewProps) {
  const update = useAppStore((state) => state.update)
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null)
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const generateCardPreview = useCallback(async (isBack: boolean = false) => {
    if (!file1 && !file2) return null

    const cardsPerPage = columns * rows
    const sheetIndex = Math.floor((cardNumber - 1) / cardsPerPage)
    const cardIndex = (cardNumber - 1) % cardsPerPage
    const row = Math.floor(cardIndex / columns)
    const col = cardIndex % columns

    let pdfPageNumber: number
    let targetFile: File | null

    if (mode === 'single') {
      const totalSheetsNeeded = Math.ceil((cardNumber) / cardsPerPage)
      if (isBack) {
        pdfPageNumber = startPage + sheetIndex * 2 + 1
      } else {
        pdfPageNumber = startPage + sheetIndex * 2
      }
      targetFile = file1
    } else {
      pdfPageNumber = startPage + sheetIndex
      targetFile = isBack ? file2 : file1
    }

    if (!targetFile) return null

    const pageKey = mode === 'single' ? `page1_${pdfPageNumber}` : 
                   (isBack ? `page2_${pdfPageNumber}` : `page1_${pdfPageNumber}`)
    
    const dimensions = pageDimensions[pageKey]
    if (!dimensions) return null

    const mmToPixels = (mm: number) => mm * (dpi / 25.4)
    
    const marginLeftPx = mmToPixels(marginLeft)
    const marginRightPx = mmToPixels(marginRight)
    const marginTopPx = mmToPixels(marginTop)
    const marginBottomPx = mmToPixels(marginBottom)
    const columnSpacingPx = mmToPixels(columnSpacing)
    const rowSpacingPx = mmToPixels(rowSpacing)
    
    const totalColumnSpacing = columnSpacingPx * (columns - 1)
    const totalRowSpacing = rowSpacingPx * (rows - 1)
    
    const pageWidthPx = dimensions.width * (dpi / 72)
    const pageHeightPx = dimensions.height * (dpi / 72)
    
    const availableWidth = pageWidthPx - marginLeftPx - marginRightPx - totalColumnSpacing
    const availableHeight = pageHeightPx - marginTopPx - marginBottomPx - totalRowSpacing
    const cellWidth = availableWidth / columns
    const cellHeight = availableHeight / rows

    let cardX: number, cardY: number
    if (isBack) {
      // For back cards (both single and separate PDF modes): use mirrored position to match grid overlay
      cardX = marginLeftPx + (columns - col - 1) * (cellWidth + columnSpacingPx)
    } else {
      // For front cards: normal left to right order
      cardX = marginLeftPx + col * (cellWidth + columnSpacingPx)
    }
    cardY = marginTopPx + row * (cellHeight + rowSpacingPx)

    return new Promise<string | null>((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      canvas.width = Math.round(cellWidth)
      canvas.height = Math.round(cellHeight)

      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        resolve(null)
        return
      }

      const fileReader = new FileReader()
      fileReader.onload = function(e) {
        const typedArray = new Uint8Array(e.target!.result as ArrayBuffer)
        const loadingTask = pdfjs.getDocument({ data: typedArray })
        loadingTask.promise.then((pdf) => {
        pdf.getPage(pdfPageNumber).then((page) => {
          const scale = dpi / 72
          const viewport = page.getViewport({ scale })

          tempCanvas.width = viewport.width
          tempCanvas.height = viewport.height

          const renderContext = {
            canvasContext: tempCtx,
            viewport: viewport,
          }

          page.render(renderContext).promise.then(() => {
            ctx.drawImage(
              tempCanvas,
              cardX, cardY, cellWidth, cellHeight,
              0, 0, cellWidth, cellHeight
            )

            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                resolve(url)
              } else {
                resolve(null)
              }
            }, 'image/png')
          }).catch(() => resolve(null))
        }).catch(() => resolve(null))
        }).catch(() => resolve(null))
      }
      fileReader.readAsArrayBuffer(targetFile)
    })
  }, [cardNumber, mode, file1, file2, columns, rows, startPage, marginLeft, marginRight, marginTop, marginBottom, columnSpacing, rowSpacing, dpi, pageDimensions])

  useEffect(() => {
    const generatePreviews = async () => {
      if (!file1 && !file2) return
      if (!isExpanded) return
      
      setIsGenerating(true)
      
      // Cleanup old URLs
      if (frontPreviewUrl) {
        URL.revokeObjectURL(frontPreviewUrl)
        setFrontPreviewUrl(null)
      }
      if (backPreviewUrl) {
        URL.revokeObjectURL(backPreviewUrl)
        setBackPreviewUrl(null)
      }
      
      try {
        const frontUrl = await generateCardPreview(false)
        setFrontPreviewUrl(frontUrl)
        
        const backUrl = await generateCardPreview(true)
        setBackPreviewUrl(backUrl)
      } catch (error) {
        console.error('Error generating card previews:', error)
      } finally {
        setIsGenerating(false)
      }
    }

    generatePreviews()
  }, [cardNumber, mode, file1, file2, columns, rows, startPage, marginLeft, marginRight, marginTop, marginBottom, columnSpacing, rowSpacing, dpi, Object.keys(pageDimensions).length, isExpanded])

  useEffect(() => {
    return () => {
      if (frontPreviewUrl) URL.revokeObjectURL(frontPreviewUrl)
      if (backPreviewUrl) URL.revokeObjectURL(backPreviewUrl)
    }
  }, [])

  return (
    <div style={{ border: '1px solid #ccc', padding: '1em', borderRadius: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5em' }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1em',
            marginRight: '0.5em',
            padding: '0',
            width: '20px',
            textAlign: 'center'
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
        <h3 style={{ margin: '0', fontSize: '1em' }}>Card Preview</h3>
      </div>
      
      {isExpanded && (
        <>
          {(!file1 && !file2) ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '2em' }}>
              Load a PDF to see card preview
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
                <label style={{ display: 'inline-block', width: '100px' }}>
                  Card Number:
                </label>
                <input
                  type="number"
                  value={cardNumber}
                  onChange={(e) => update('previewCardNumber', Math.max(1, Number(e.target.value)))}
                  style={{ width: '80px' }}
                  min="1"
                />
              </div>
              
              {isGenerating ? (
                <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
                  Generating preview...
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1em', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 0.5em 0', fontSize: '0.9em' }}>
                      Card {cardNumber} (Front)
                    </h4>
                    {frontPreviewUrl ? (
                      <img
                        src={frontPreviewUrl}
                        alt={`Card ${cardNumber} Front`}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <div style={{
                        border: '2px dashed #ccc',
                        padding: '2em',
                        textAlign: 'center',
                        color: '#666',
                        borderRadius: '4px'
                      }}>
                        Front not available
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 0.5em 0', fontSize: '0.9em' }}>
                      Card {cardNumber} (Back)
                    </h4>
                    {backPreviewUrl ? (
                      <img
                        src={backPreviewUrl}
                        alt={`Card ${cardNumber} Back`}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <div style={{
                        border: '2px dashed #ccc',
                        padding: '2em',
                        textAlign: 'center',
                        color: '#666',
                        borderRadius: '4px'
                      }}>
                        Back not available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

interface CardExportProps {
  mode: 'single' | 'separate'
  file1: File | null
  file2: File | null
  columns: number
  rows: number
  startPage: number
  finishPage: number | null
  numPages1: number
  numPages2: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
  columnSpacing: number
  rowSpacing: number
  dpi: number
  templateName: string
  pageDimensions: {[key: string]: {width: number, height: number}}
}

function CardExport({ mode, file1, file2, columns, rows, startPage, finishPage, numPages1, numPages2, marginLeft, marginRight, marginTop, marginBottom, columnSpacing, rowSpacing, dpi, templateName, pageDimensions }: CardExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState({ completed: 0, total: 0 })

  const generateCardImage = useCallback(async (cardNumber: number, isBack: boolean, targetFile: File, pdfPageNumber: number, pageKey: string): Promise<{ filename: string, blob: Blob } | null> => {
    const dimensions = pageDimensions[pageKey]
    if (!dimensions || !targetFile) return null

    const cardsPerPage = columns * rows
    const cardIndex = (cardNumber - 1) % cardsPerPage
    const row = Math.floor(cardIndex / columns)
    const col = cardIndex % columns

    const mmToPixels = (mm: number) => mm * (dpi / 25.4)
    
    const marginLeftPx = mmToPixels(marginLeft)
    const marginRightPx = mmToPixels(marginRight)
    const marginTopPx = mmToPixels(marginTop)
    const marginBottomPx = mmToPixels(marginBottom)
    const columnSpacingPx = mmToPixels(columnSpacing)
    const rowSpacingPx = mmToPixels(rowSpacing)
    
    const totalColumnSpacing = columnSpacingPx * (columns - 1)
    const totalRowSpacing = rowSpacingPx * (rows - 1)
    
    const pageWidthPx = dimensions.width * (dpi / 72)
    const pageHeightPx = dimensions.height * (dpi / 72)
    
    const availableWidth = pageWidthPx - marginLeftPx - marginRightPx - totalColumnSpacing
    const availableHeight = pageHeightPx - marginTopPx - marginBottomPx - totalRowSpacing
    const cellWidth = availableWidth / columns
    const cellHeight = availableHeight / rows

    let cardX: number, cardY: number
    if (isBack) {
      cardX = marginLeftPx + (columns - col - 1) * (cellWidth + columnSpacingPx)
    } else {
      cardX = marginLeftPx + col * (cellWidth + columnSpacingPx)
    }
    cardY = marginTopPx + row * (cellHeight + rowSpacingPx)

    return new Promise<{ filename: string, blob: Blob } | null>((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      canvas.width = Math.round(cellWidth)
      canvas.height = Math.round(cellHeight)

      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        resolve(null)
        return
      }

      const fileReader = new FileReader()
      fileReader.onload = function(e) {
        const typedArray = new Uint8Array(e.target!.result as ArrayBuffer)
        const loadingTask = pdfjs.getDocument({ data: typedArray })
        loadingTask.promise.then((pdf) => {
          pdf.getPage(pdfPageNumber).then((page) => {
            const scale = dpi / 72
            const viewport = page.getViewport({ scale })

            tempCanvas.width = viewport.width
            tempCanvas.height = viewport.height

            const renderContext = {
              canvasContext: tempCtx,
              viewport: viewport,
            }

            page.render(renderContext).promise.then(() => {
              ctx.drawImage(
                tempCanvas,
                cardX, cardY, cellWidth, cellHeight,
                0, 0, cellWidth, cellHeight
              )

              canvas.toBlob((blob) => {
                if (blob) {
                  const side = isBack ? 'back' : 'front'
                  const paddedCardNumber = cardNumber.toString().padStart(3, '0')
                  const filename = `${templateName}-${paddedCardNumber}-${side}.png`
                  resolve({ filename, blob })
                } else {
                  resolve(null)
                }
              }, 'image/png')
            }).catch(() => resolve(null))
          }).catch(() => resolve(null))
        }).catch(() => resolve(null))
      }
      fileReader.readAsArrayBuffer(targetFile)
    })
  }, [columns, rows, marginLeft, marginRight, marginTop, marginBottom, columnSpacing, rowSpacing, dpi, templateName, pageDimensions])

  const exportAllCards = useCallback(async () => {
    if (!file1 && !file2) return

    setIsExporting(true)
    
    const effectiveFinishPage = finishPage || Math.max(numPages1, numPages2)
    const totalPages = effectiveFinishPage - startPage + 1
    const cardsPerPage = columns * rows
    
    let totalCards: number
    if (mode === 'single') {
      totalCards = Math.floor(totalPages / 2) * cardsPerPage
    } else {
      totalCards = totalPages * cardsPerPage
    }
    
    setExportProgress({ completed: 0, total: totalCards })
    
    const exportedFiles: Array<{ filename: string, blob: Blob }> = []
    
    try {
      for (let cardNumber = 1; cardNumber <= totalCards; cardNumber++) {
        const cardsPerPage = columns * rows
        const sheetIndex = Math.floor((cardNumber - 1) / cardsPerPage)
        
        // Generate front card
        let frontPdfPageNumber: number
        let frontTargetFile: File | null
        let frontPageKey: string
        
        if (mode === 'single') {
          frontPdfPageNumber = startPage + sheetIndex * 2
          frontTargetFile = file1
          frontPageKey = `page1_${frontPdfPageNumber}`
        } else {
          frontPdfPageNumber = startPage + sheetIndex
          frontTargetFile = file1
          frontPageKey = `page1_${frontPdfPageNumber}`
        }
        
        if (frontTargetFile) {
          const frontCard = await generateCardImage(cardNumber, false, frontTargetFile, frontPdfPageNumber, frontPageKey)
          if (frontCard) {
            exportedFiles.push(frontCard)
          }
        }
        
        // Generate back card
        let backPdfPageNumber: number
        let backTargetFile: File | null
        let backPageKey: string
        
        if (mode === 'single') {
          backPdfPageNumber = startPage + sheetIndex * 2 + 1
          backTargetFile = file1
          backPageKey = `page1_${backPdfPageNumber}`
        } else {
          backPdfPageNumber = startPage + sheetIndex
          backTargetFile = file2
          backPageKey = `page2_${backPdfPageNumber}`
        }
        
        if (backTargetFile) {
          const backCard = await generateCardImage(cardNumber, true, backTargetFile, backPdfPageNumber, backPageKey)
          if (backCard) {
            exportedFiles.push(backCard)
          }
        }
        
        setExportProgress(prev => ({ ...prev, completed: cardNumber }))
      }
      
      console.log('Exported files:', exportedFiles.map(f => f.filename))
      console.log('File objects:', exportedFiles)
      
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [mode, file1, file2, startPage, finishPage, numPages1, numPages2, columns, rows, generateCardImage])

  if (!file1 && !file2) {
    return null
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
      <button 
        onClick={exportAllCards}
        disabled={isExporting}
        style={{
          padding: '0.5em 1em',
          backgroundColor: isExporting ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isExporting ? 'not-allowed' : 'pointer'
        }}
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </button>
      
      {isExporting && (
        <div style={{ 
          fontSize: '0.9em', 
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5em'
        }}>
          <span>{exportProgress.completed}/{exportProgress.total}</span>
          <div style={{
            width: '100px',
            height: '8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(exportProgress.completed / exportProgress.total) * 100}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.2s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const mode = useAppStore((state) => state.mode)
  const file1 = useAppStore((state) => state.file1)
  const numPages1 = useAppStore((state) => state.numPages1)
  const file2 = useAppStore((state) => state.file2)
  const numPages2 = useAppStore((state) => state.numPages2)
  
  const columns = useAppStore((state) => state.columns)
  const rows = useAppStore((state) => state.rows)
  const startPage = useAppStore((state) => state.startPage)
  const finishPage = useAppStore((state) => state.finishPage)
  const marginLeft = useAppStore((state) => state.marginLeft)
  const marginRight = useAppStore((state) => state.marginRight)
  const marginTop = useAppStore((state) => state.marginTop)
  const marginBottom = useAppStore((state) => state.marginBottom)
  const columnSpacing = useAppStore((state) => state.columnSpacing)
  const rowSpacing = useAppStore((state) => state.rowSpacing)
  const rotation = useAppStore((state) => state.rotation)
  const outlineColor = useAppStore((state) => state.outlineColor)
  const dpi = useAppStore((state) => state.dpi)
  const templateName = useAppStore((state) => state.templateName)
  const previewCardNumber = useAppStore((state) => state.previewCardNumber)
  const update = useAppStore((state) => state.update)
  const [renderedPageDimensions, setRenderedPageDimensions] = useState<{[key: string]: {width: number, height: number}}>({})
  
  const pageDimensions = useMemo(() => {
    // Use rendered dimensions if available, otherwise calculate standard A4 dimensions at 72 DPI
    if (Object.keys(renderedPageDimensions).length > 0) {
      return renderedPageDimensions
    }
    
    // Standard A4 dimensions: 210 × 297 mm
    // Convert to pixels at 72 DPI: (mm * 72) / 25.4
    const a4Width = (210 * 72) / 25.4  // ~595 pixels
    const a4Height = (297 * 72) / 25.4 // ~842 pixels
    
    const standardDimensions: {[key: string]: {width: number, height: number}} = {}
    
    // Create dimensions for potential pages based on current file loading state
    if (mode === 'single' && numPages1 > 0) {
      for (let i = 1; i <= numPages1; i++) {
        standardDimensions[`page1_${i}`] = { width: a4Width, height: a4Height }
      }
    } else if (mode === 'separate') {
      if (numPages1 > 0) {
        for (let i = 1; i <= numPages1; i++) {
          standardDimensions[`page1_${i}`] = { width: a4Width, height: a4Height }
        }
      }
      if (numPages2 > 0) {
        for (let i = 1; i <= numPages2; i++) {
          standardDimensions[`page2_${i}`] = { width: a4Width, height: a4Height }
        }
      }
    }
    
    return standardDimensions
  }, [renderedPageDimensions, mode, numPages1, numPages2])

  const onFile1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      update('file1', selectedFile)
    }
  }

  const onFile2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      update('file2', selectedFile)
    }
  }

  const onDocument1LoadSuccess = ({ numPages }: { numPages: number }) => {
    update('numPages1', numPages)
  }

  const onDocument2LoadSuccess = ({ numPages }: { numPages: number }) => {
    update('numPages2', numPages)
  }

  const GridOverlay = ({ pageWidth, pageHeight, isBackPage, pageOffset, mode }: { pageWidth: number, pageHeight: number, isBackPage?: boolean, pageOffset?: number, mode: 'single' | 'separate' }) => {
    // Convert mm to pixels assuming 72 DPI (standard PDF DPI)
    // 1 inch = 25.4 mm, 1 inch = 72 pixels, so 1 mm = 72/25.4 ≈ 2.83 pixels
    const mmToPixels = (mm: number) => mm * (72 / 25.4)
    
    const marginLeftPx = mmToPixels(marginLeft)
    const marginRightPx = mmToPixels(marginRight)
    const marginTopPx = mmToPixels(marginTop)
    const marginBottomPx = mmToPixels(marginBottom)
    const columnSpacingPx = mmToPixels(columnSpacing)
    const rowSpacingPx = mmToPixels(rowSpacing)
    
    // Calculate available space accounting for spacing between cards
    const totalColumnSpacing = columnSpacingPx * (columns - 1)
    const totalRowSpacing = rowSpacingPx * (rows - 1)
    
    const availableWidth = pageWidth - marginLeftPx - marginRightPx - totalColumnSpacing
    const availableHeight = pageHeight - marginTopPx - marginBottomPx - totalRowSpacing
    const cellWidth = availableWidth / columns
    const cellHeight = availableHeight / rows

    const getCardNumber = (row: number, col: number): string => {
      const cardsPerPage = columns * rows
      
      if (mode === 'single') {
        // Single PDF mode: front/back pairs, divide by 2 for sheet offset
        const sheetOffset = Math.floor((pageOffset || 0) / 2) * cardsPerPage
        
        if (isBackPage) {
          // Back pages: reverse the numbering with (Back) suffix within each row
          const baseNumber = row * columns + (columns - col) + sheetOffset
          return `${baseNumber} (Back)`
        } else {
          // Front pages: normal numbering with (Front) suffix
          const cardNumber = row * columns + col + 1 + sheetOffset
          return `${cardNumber} (Front)`
        }
      } else {
        // Separate PDF mode: each PDF shows the same card numbers
        const sheetOffset = (pageOffset || 0) * cardsPerPage
        
        if (isBackPage) {
          // Back pages: reverse the numbering with (Back) suffix within each row
          const baseNumber = row * columns + (columns - col) + sheetOffset
          return `${baseNumber} (Back)`
        } else {
          // Front pages: normal numbering with (Front) suffix
          const cardNumber = row * columns + col + 1 + sheetOffset
          return `${cardNumber} (Front)`
        }
      }
    }

    const gridBoxes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = marginLeftPx + col * (cellWidth + columnSpacingPx)
        const y = marginTopPx + row * (cellHeight + rowSpacingPx)
        const cardNumber = getCardNumber(row, col)
        
        gridBoxes.push(
          <div
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: cellWidth,
              height: cellHeight,
              border: `1px solid ${outlineColor}`,
              boxSizing: 'border-box',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: '2px'
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: outlineColor,
                textShadow: '1px 1px 1px rgba(255,255,255,0.5)',
                lineHeight: '1'
              }}
            >
              {cardNumber}
            </span>
          </div>
        )
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: pageWidth,
          height: pageHeight,
          pointerEvents: 'none'
        }}
      >
        {gridBoxes}
      </div>
    )
  }

  return (
    <div>
      <h1>Cardcutter</h1>
      <p>Turn PDF card sheets into individual cards for <a href="https://probability.nz" target="_blank" rel="noopener noreferrer">Probability</a></p>
      
      <div style={{ display: 'flex', gap: '1em', marginBottom: '1em', flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #ccc', padding: '1em', borderRadius: '4px', flex: '1', minWidth: '300px' }}>
          <h3 style={{ margin: '0 0 0.5em 0', fontSize: '1em' }}>PDF Setup</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5em' }}>
                <input
                  type="radio"
                  value="single"
                  checked={mode === 'single'}
                  onChange={(e) => update('mode', 'single')}
                  style={{ marginRight: '0.5em' }}
                />
                Front and back on 1 pdf
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  value="separate"
                  checked={mode === 'separate'}
                  onChange={(e) => update('mode', 'separate')}
                  style={{ marginRight: '0.5em' }}
                />
                Front and back on separate PDFs
              </label>
            </div>
            
            <div style={{ marginTop: '0.5em' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5em' }}>
                <label style={{ display: 'inline-block', width: '120px' }}>
                  {mode === 'single' ? 'Front/Back PDF:' : 'Front PDF:'}
                </label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={onFile1Change} 
                  style={{ flex: 1 }}
                />
              </div>
              {mode === 'separate' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ display: 'inline-block', width: '120px' }}>
                    Back PDF:
                  </label>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={onFile2Change} 
                    style={{ flex: 1 }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid #ccc', padding: '1em', borderRadius: '4px', flex: '1', minWidth: '250px' }}>
          <h3 style={{ margin: '0 0 0.5em 0', fontSize: '1em' }}>Sheet Options</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
            {(file1 || file2) && (
              <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ display: 'inline-block', width: '100px' }}>
                    Start Page:
                  </label>
                  <input
                    type="number"
                    value={startPage}
                    onChange={(e) => update('startPage', Math.max(1, Math.min(Number(e.target.value), Math.max(numPages1, numPages2))))}
                    style={{ width: '60px' }}
                    min="1"
                    max={Math.max(numPages1, numPages2)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ display: 'inline-block', width: '100px' }}>
                    Finish Page:
                  </label>
                  <input
                    type="number"
                    value={finishPage || Math.max(numPages1, numPages2)}
                    onChange={(e) => {
                      const maxPages = Math.max(numPages1, numPages2)
                      const value = Number(e.target.value)
                      update('finishPage', value === maxPages ? null : Math.max(startPage, Math.min(value, maxPages)))
                    }}
                    style={{ width: '60px' }}
                    min={startPage}
                    max={Math.max(numPages1, numPages2)}
                  />
                </div>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'inline-block', width: '100px' }}>
                Rotation:
              </label>
              <select
                disabled
                value={rotation}
                onChange={(e) => update('rotation', Number(e.target.value))}
                style={{ width: '80px' }}
              >
                <option value={0}>0°</option>
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'inline-block', width: '100px' }}>
                Outline Color:
              </label>
              <select
                value={outlineColor}
                onChange={(e) => update('outlineColor', e.target.value)}
                style={{ width: '80px' }}
              >
                <option value="red">Red</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid #ccc', padding: '1em', borderRadius: '4px', flex: '1', minWidth: '250px' }}>
            <h3 style={{ margin: '0 0 0.5em 0', fontSize: '1em' }}>Card Layout</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-block', width: '100px' }}>
                  Columns:
                </label>
                <input
                  type="number"
                  value={columns}
                  onChange={(e) => update('columns', Number(e.target.value))}
                  style={{ width: '60px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-block', width: '100px' }}>
                  Rows:
                </label>
                <input
                  type="number"
                  value={rows}
                  onChange={(e) => update('rows', Number(e.target.value))}
                  style={{ width: '60px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-block', width: '100px' }}>
                  Col Spacing:
                </label>
                <input
                  type="number"
                  value={columnSpacing}
                  onChange={(e) => update('columnSpacing', Number(e.target.value))}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.1"
                  min="0"
                />
                <span style={{ marginRight: '8px' }}>mm</span>
                <input
                  type="number"
                  value={Math.round((columnSpacing / 25.4) * 100) / 100}
                  onChange={(e) => update('columnSpacing', Number(e.target.value) * 25.4)}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.01"
                  min="0"
                />
                <span>in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-block', width: '100px' }}>
                  Row Spacing:
                </label>
                <input
                  type="number"
                  value={rowSpacing}
                  onChange={(e) => update('rowSpacing', Number(e.target.value))}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.1"
                  min="0"
                />
                <span style={{ marginRight: '8px' }}>mm</span>
                <input
                  type="number"
                  value={Math.round((rowSpacing / 25.4) * 100) / 100}
                  onChange={(e) => update('rowSpacing', Number(e.target.value) * 25.4)}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.01"
                  min="0"
                />
                <span>in</span>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '1em', borderRadius: '4px', flex: '1', minWidth: '250px' }}>
            <h3 style={{ margin: '0 0 0.5em 0', fontSize: '1em' }}>Page Margins</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-block', width: '60px' }}>
                  Left:
                </label>
                <input
                  type="number"
                  value={marginLeft}
                  onChange={(e) => update('marginLeft', Number(e.target.value))}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.1"
                />
                <span style={{ marginRight: '8px' }}>mm</span>
                <input
                  type="number"
                  value={Math.round((marginLeft / 25.4) * 100) / 100}
                  onChange={(e) => update('marginLeft', Number(e.target.value) * 25.4)}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.01"
                />
                <span>in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-block', width: '60px' }}>
                  Right:
                </label>
                <input
                  type="number"
                  value={marginRight}
                  onChange={(e) => update('marginRight', Number(e.target.value))}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.1"
                />
                <span style={{ marginRight: '8px' }}>mm</span>
                <input
                  type="number"
                  value={Math.round((marginRight / 25.4) * 100) / 100}
                  onChange={(e) => update('marginRight', Number(e.target.value) * 25.4)}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.01"
                />
                <span>in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-block', width: '60px' }}>
                  Top:
                </label>
                <input
                  type="number"
                  value={marginTop}
                  onChange={(e) => update('marginTop', Number(e.target.value))}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.1"
                />
                <span style={{ marginRight: '8px' }}>mm</span>
                <input
                  type="number"
                  value={Math.round((marginTop / 25.4) * 100) / 100}
                  onChange={(e) => update('marginTop', Number(e.target.value) * 25.4)}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.01"
                />
                <span>in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-block', width: '60px' }}>
                  Bottom:
                </label>
                <input
                  type="number"
                  value={marginBottom}
                  onChange={(e) => update('marginBottom', Number(e.target.value))}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.1"
                />
                <span style={{ marginRight: '8px' }}>mm</span>
                <input
                  type="number"
                  value={Math.round((marginBottom / 25.4) * 100) / 100}
                  onChange={(e) => update('marginBottom', Number(e.target.value) * 25.4)}
                  style={{ width: '60px', marginRight: '4px' }}
                  step="0.01"
                />
                <span>in</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: '1em', border: '1px solid #ccc', padding: '1em', borderRadius: '4px' }}>
          <CardSize
            columns={columns}
            rows={rows}
            marginLeft={marginLeft}
            marginRight={marginRight}
            marginTop={marginTop}
            marginBottom={marginBottom}
            columnSpacing={columnSpacing}
            rowSpacing={rowSpacing}
            dpi={dpi}
            pageDimensions={pageDimensions}
          />
          <div style={{ marginTop: '1em', display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'inline-block', width: '60px' }}>
                DPI:
              </label>
              <input
                type="number"
                value={dpi}
                onChange={(e) => update('dpi', Number(e.target.value))}
                style={{ width: '60px' }}
                min="72"
                step="1"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'inline-block', width: '100px' }}>
                Template name:
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => update('templateName', e.target.value)}
                placeholder="card"
                style={{ width: '120px' }}
              />
            </div>
            <CardExport
              mode={mode}
              file1={file1}
              file2={file2}
              columns={columns}
              rows={rows}
              startPage={startPage}
              finishPage={finishPage}
              numPages1={numPages1}
              numPages2={numPages2}
              marginLeft={marginLeft}
              marginRight={marginRight}
              marginTop={marginTop}
              marginBottom={marginBottom}
              columnSpacing={columnSpacing}
              rowSpacing={rowSpacing}
              dpi={dpi}
              templateName={templateName}
              pageDimensions={pageDimensions}
            />
          </div>
        </div>

      <CardPreview
        cardNumber={previewCardNumber}
        mode={mode}
        file1={file1}
        file2={file2}
        columns={columns}
        rows={rows}
        startPage={startPage}
        marginLeft={marginLeft}
        marginRight={marginRight}
        marginTop={marginTop}
        marginBottom={marginBottom}
        columnSpacing={columnSpacing}
        rowSpacing={rowSpacing}
        dpi={dpi}
        pageDimensions={pageDimensions}
      />

      <div style={{ display: 'flex', gap: '2em' }}>
        <div style={{ flex: 1 }}>
          
          <div style={{ overflow: 'auto', maxHeight: '70vh', border: '1px solid #ccc', marginTop: '1em' }}>
            {mode === 'single' ? (
              // Single PDF mode: 1 page per line
              file1 && (
                <Document 
                  file={file1} 
                  onLoadSuccess={onDocument1LoadSuccess}
                >
                  {Array.from(new Array(numPages1), (el, index) => {
                    const pageNumber = index + 1
                    const pageKey = `page1_${pageNumber}`
                    const dimensions = pageDimensions[pageKey]
                    const effectiveFinishPage = finishPage || numPages1
                    const isInRange = pageNumber >= startPage && pageNumber <= effectiveFinishPage
                    return (
                      <div key={pageKey} style={{ 
                        margin: '0 0 2em 0', 
                        padding: 0, 
                        display: 'inline-block', 
                        position: 'relative'
                      }}>
                        <Page 
                          pageNumber={pageNumber}
                          onRenderSuccess={() => {
                            setTimeout(() => {
                              const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`) as HTMLElement
                              if (pageElement) {
                                const canvas = pageElement.querySelector('canvas')
                                if (canvas) {
                                  setRenderedPageDimensions(prev => ({
                                    ...prev,
                                    [pageKey]: { width: canvas.clientWidth, height: canvas.clientHeight }
                                  }))
                                }
                              }
                            }, 100)
                          }}
                        />
                        {dimensions && (
                          <>
                            {isInRange && (
                              <div 
                                className="grid-overlay-container"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  pointerEvents: 'none'
                                }}
                              >
                                <GridOverlay 
                                  pageWidth={dimensions.width} 
                                  pageHeight={dimensions.height} 
                                  isBackPage={(pageNumber - startPage + 1) % 2 === 0}
                                  pageOffset={pageNumber - startPage}
                                  mode={mode}
                                />
                              </div>
                            )}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '4px',
                                right: '4px',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '12px',
                                pointerEvents: 'none'
                              }}
                            >
                              Page {pageNumber}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </Document>
              )
            ) : (
              // Separate PDF mode: 2 pages per line (front and back side by side)
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2em' }}>
                {/* Front PDF Document */}
                {file1 && (
                  <Document file={file1} onLoadSuccess={onDocument1LoadSuccess} key="front-doc">
                    {Array.from(new Array(numPages1), (el, index) => {
                      const pageNumber = index + 1
                      const effectiveFinishPage = finishPage || Math.max(numPages1, numPages2)
                      const isInRange = pageNumber >= startPage && pageNumber <= effectiveFinishPage
                      
                      return (
                        <div key={`page-pair-${pageNumber}`} style={{ 
                          margin: '0 0 2em 0', 
                          padding: 0, 
                          display: 'flex', 
                          gap: '2em',
                          alignItems: 'flex-start'
                        }}>
                          {/* Front page */}
                          <div style={{ flex: '1', position: 'relative', minWidth: 0 }} className="front-page-container">
                            <Page 
                              pageNumber={pageNumber}
                              onRenderSuccess={() => {
                                setTimeout(() => {
                                  const pageElement = document.querySelector(`.front-page-container [data-page-number="${pageNumber}"]`) as HTMLElement
                                  if (pageElement) {
                                    const canvas = pageElement.querySelector('canvas')
                                    if (canvas) {
                                      setRenderedPageDimensions(prev => ({
                                        ...prev,
                                        [`page1_${pageNumber}`]: { width: canvas.clientWidth, height: canvas.clientHeight }
                                      }))
                                    }
                                  }
                                }, 100)
                              }}
                            />
                            {pageDimensions[`page1_${pageNumber}`] && (
                              <>
                                {isInRange && (
                                  <div 
                                    className="grid-overlay-container"
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <GridOverlay 
                                      pageWidth={pageDimensions[`page1_${pageNumber}`].width} 
                                      pageHeight={pageDimensions[`page1_${pageNumber}`].height} 
                                      isBackPage={false}
                                      pageOffset={pageNumber - startPage}
                                      mode={mode}
                                    />
                                  </div>
                                )}
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    right: '4px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    pointerEvents: 'none'
                                  }}
                                >
                                  Front Page {pageNumber}
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Back page */}
                          {file2 ? (
                            <div style={{ flex: '1', position: 'relative', minWidth: 0 }} className="back-page-container">
                              <Document file={file2} onLoadSuccess={onDocument2LoadSuccess} key="back-doc">
                                <Page 
                                  pageNumber={pageNumber}
                                  onRenderSuccess={() => {
                                    setTimeout(() => {
                                      const pageElement = document.querySelector(`.back-page-container [data-page-number="${pageNumber}"]`) as HTMLElement
                                      if (pageElement) {
                                        const canvas = pageElement.querySelector('canvas')
                                        if (canvas) {
                                          setRenderedPageDimensions(prev => ({
                                            ...prev,
                                            [`page2_${pageNumber}`]: { width: canvas.clientWidth, height: canvas.clientHeight }
                                          }))
                                        }
                                      }
                                    }, 100)
                                  }}
                                />
                                {pageDimensions[`page2_${pageNumber}`] && (
                                  <>
                                    {isInRange && (
                                      <div 
                                        className="grid-overlay-container"
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          pointerEvents: 'none'
                                        }}
                                      >
                                        <GridOverlay 
                                          pageWidth={pageDimensions[`page2_${pageNumber}`].width} 
                                          pageHeight={pageDimensions[`page2_${pageNumber}`].height} 
                                          isBackPage={true}
                                          pageOffset={pageNumber - startPage}
                                          mode={mode}
                                        />
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        right: '4px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontSize: '12px',
                                        pointerEvents: 'none'
                                      }}
                                    >
                                      Back Page {pageNumber}
                                    </div>
                                  </>
                                )}
                              </Document>
                            </div>
                          ) : (
                            <div style={{ flex: '1', position: 'relative', minWidth: 0 }} className="back-page-placeholder">
                              <div style={{ 
                                border: '2px dashed #ccc', 
                                padding: '2em', 
                                textAlign: 'center', 
                                color: '#666',
                                minHeight: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                No back PDF loaded
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </Document>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
