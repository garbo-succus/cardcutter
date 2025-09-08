import { useState, useRef, useEffect } from 'react'
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
      Card size: {cardSize.widthMm}×{cardSize.heightMm}mm ({cardSize.widthIn}×{cardSize.heightIn}") ({cardSize.widthPixels}×{cardSize.heightPixels} pixels)
    </span>
  )
}

function App() {
  const [mode, setMode] = useState<'single' | 'separate'>('single')
  const [file1, setFile1] = useState<File | null>(null)
  const [numPages1, setNumPages1] = useState<number>(0)
  const [file2, setFile2] = useState<File | null>(null)
  const [numPages2, setNumPages2] = useState<number>(0)
  
  const [columns, setColumns] = useState<number>(4)
  const [rows, setRows] = useState<number>(2)
  const marginLeft = useAppStore((state) => state.marginLeft)
  const marginRight = useAppStore((state) => state.marginRight)
  const marginTop = useAppStore((state) => state.marginTop)
  const marginBottom = useAppStore((state) => state.marginBottom)
  const update = useAppStore((state) => state.update)
  const [columnSpacing, setColumnSpacing] = useState<number>(0)
  const [rowSpacing, setRowSpacing] = useState<number>(0)
  const [startPage, setStartPage] = useState<number>(1)
  const [finishPage, setFinishPage] = useState<number | null>(null)
  const [rotation, setRotation] = useState<number>(0)
  const [outlineColor, setOutlineColor] = useState<string>('red')
  const [dpi, setDpi] = useState<number>(300)
  const [pageDimensions, setPageDimensions] = useState<{[key: string]: {width: number, height: number}}>({})

  const onFile1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile1(selectedFile)
    }
  }

  const onFile2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile2(selectedFile)
    }
  }

  const onDocument1LoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages1(numPages)
  }

  const onDocument2LoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages2(numPages)
  }

  const GridOverlay = ({ pageWidth, pageHeight, isBackPage, pageOffset }: { pageWidth: number, pageHeight: number, isBackPage?: boolean, pageOffset?: number }) => {
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
      // For front/back pairs, we need to calculate which "sheet" this is
      // Each sheet has front and back, so we divide by 2 and floor
      const sheetOffset = Math.floor((pageOffset || 0) / 2) * cardsPerPage
      
      if (isBackPage) {
        // Back pages: reverse the numbering with (Back) suffix within each row
        // First row: 4 (Back), 3 (Back), 2 (Back), 1 (Back)
        // Second row: 8 (Back), 7 (Back), 6 (Back), 5 (Back)
        const baseNumber = row * columns + (columns - col) + sheetOffset
        return `${baseNumber} (Back)`
      } else {
        // Front pages: normal numbering with (Front) suffix
        const cardNumber = row * columns + col + 1 + sheetOffset
        return `${cardNumber} (Front)`
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
      
      <div style={{ marginBottom: '1em' }}>
        <label>
          <input
            type="radio"
            value="single"
            checked={mode === 'single'}
            onChange={(e) => setMode('single')}
          />
          Front and back on 1 pdf
        </label>
        <label style={{ marginLeft: '1em' }}>
          <input
            type="radio"
            value="separate"
            checked={mode === 'separate'}
            onChange={(e) => setMode('separate')}
          />
          Front and back on separate PDFs
        </label>
      </div>

      <div style={{ marginBottom: '1em', display: 'flex', gap: '1em', flexWrap: 'wrap' }}>
        {(file1 || file2) && (
          <>
            <label>
              Start Page:
              <input
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(Math.max(1, Math.min(Number(e.target.value), Math.max(numPages1, numPages2))))}
                style={{ marginLeft: '0.5em', width: '60px' }}
                min="1"
                max={Math.max(numPages1, numPages2)}
              />
            </label>
            <label>
              Finish Page:
              <input
                type="number"
                value={finishPage || Math.max(numPages1, numPages2)}
                onChange={(e) => {
                  const maxPages = Math.max(numPages1, numPages2)
                  const value = Number(e.target.value)
                  setFinishPage(value === maxPages ? null : Math.max(startPage, Math.min(value, maxPages)))
                }}
                style={{ marginLeft: '0.5em', width: '60px' }}
                min={startPage}
                max={Math.max(numPages1, numPages2)}
              />
            </label>
          </>
        )}
        <label>
          Columns:
          <input
            type="number"
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
          />
        </label>
        <label>
          Rows:
          <input
            type="number"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
          />
        </label>
        <label>
          Margin Left (mm):
          <input
            type="number"
            value={marginLeft}
            onChange={(e) => update('marginLeft', Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
            min="0"
          />
          (inches)
          <input
            type="number"
            value={Math.round((marginLeft / 25.4) * 100) / 100}
            onChange={(e) => update('marginLeft', Number(e.target.value) * 25.4)}
            style={{ marginLeft: '0.25em', width: '60px' }}
            step="0.01"
            min="0"
          />
        </label>
        <label>
          Margin Right (mm):
          <input
            type="number"
            value={marginRight}
            onChange={(e) => update('marginRight', Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
            min="0"
          />
          (inches)
          <input
            type="number"
            value={Math.round((marginRight / 25.4) * 100) / 100}
            onChange={(e) => update('marginRight', Number(e.target.value) * 25.4)}
            style={{ marginLeft: '0.25em', width: '60px' }}
            step="0.01"
            min="0"
          />
        </label>
        <label>
          Margin Top (mm):
          <input
            type="number"
            value={marginTop}
            onChange={(e) => update('marginTop', Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
            min="0"
          />
          (inches)
          <input
            type="number"
            value={Math.round((marginTop / 25.4) * 100) / 100}
            onChange={(e) => update('marginTop', Number(e.target.value) * 25.4)}
            style={{ marginLeft: '0.25em', width: '60px' }}
            step="0.01"
            min="0"
          />
        </label>
        <label>
          Margin Bottom (mm):
          <input
            type="number"
            value={marginBottom}
            onChange={(e) => update('marginBottom', Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
            min="0"
          />
          (inches)
          <input
            type="number"
            value={Math.round((marginBottom / 25.4) * 100) / 100}
            onChange={(e) => update('marginBottom', Number(e.target.value) * 25.4)}
            style={{ marginLeft: '0.25em', width: '60px' }}
            step="0.01"
            min="0"
          />
        </label>
        <label>
          Column Spacing (mm):
          <input
            type="number"
            value={columnSpacing}
            onChange={(e) => setColumnSpacing(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
            min="0"
          />
          (inches)
          <input
            type="number"
            value={Math.round((columnSpacing / 25.4) * 100) / 100}
            onChange={(e) => setColumnSpacing(Number(e.target.value) * 25.4)}
            style={{ marginLeft: '0.25em', width: '60px' }}
            step="0.01"
            min="0"
          />
        </label>
        <label>
          Row Spacing (mm):
          <input
            type="number"
            value={rowSpacing}
            onChange={(e) => setRowSpacing(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
            min="0"
          />
          (inches)
          <input
            type="number"
            value={Math.round((rowSpacing / 25.4) * 100) / 100}
            onChange={(e) => setRowSpacing(Number(e.target.value) * 25.4)}
            style={{ marginLeft: '0.25em', width: '60px' }}
            step="0.01"
            min="0"
          />
        </label>
        <label>
          Rotation:
          <select
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            style={{ marginLeft: '0.5em' }}
          >
            <option value={0}>0°</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </label>
        <label>
          Outline Color:
          <select
            value={outlineColor}
            onChange={(e) => setOutlineColor(e.target.value)}
            style={{ marginLeft: '0.5em' }}
          >
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
          </select>
        </label>
        <label>
          DPI:
          <input
            type="number"
            value={dpi}
            onChange={(e) => setDpi(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            min="72"
            step="1"
          />
        </label>
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
      </div>

      <div style={{ display: 'flex', gap: '2em' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '1em' }}>
            <span>{mode === 'single' ? 'Front/Back' : 'Front'}</span>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={onFile1Change} 
              style={{ marginLeft: '1em' }}
            />
            {mode === 'separate' && (
              <>
                <span style={{ marginLeft: '2em' }}>Back</span>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={onFile2Change} 
                  style={{ marginLeft: '1em' }}
                />
              </>
            )}
          </div>
          
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
                                  setPageDimensions(prev => ({
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
                                      setPageDimensions(prev => ({
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
                                          setPageDimensions(prev => ({
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
