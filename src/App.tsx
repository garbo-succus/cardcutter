import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function App() {
  const [mode, setMode] = useState<'single' | 'separate'>('single')
  const [file1, setFile1] = useState<File | null>(null)
  const [numPages1, setNumPages1] = useState<number>(0)
  const [file2, setFile2] = useState<File | null>(null)
  const [numPages2, setNumPages2] = useState<number>(0)
  
  const [columns, setColumns] = useState<number>(4)
  const [rows, setRows] = useState<number>(2)
  const [marginLeft, setMarginLeft] = useState<number>(0)
  const [marginRight, setMarginRight] = useState<number>(0)
  const [marginTop, setMarginTop] = useState<number>(0)
  const [marginBottom, setMarginBottom] = useState<number>(0)
  const [rotation, setRotation] = useState<number>(0)
  const [outlineColor, setOutlineColor] = useState<string>('red')
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

  const GridOverlay = ({ pageWidth, pageHeight }: { pageWidth: number, pageHeight: number }) => {
    // Convert mm to pixels assuming 72 DPI (standard PDF DPI)
    // 1 inch = 25.4 mm, 1 inch = 72 pixels, so 1 mm = 72/25.4 ≈ 2.83 pixels
    const mmToPixels = (mm: number) => mm * (72 / 25.4)
    
    const marginLeftPx = mmToPixels(marginLeft)
    const marginRightPx = mmToPixels(marginRight)
    const marginTopPx = mmToPixels(marginTop)
    const marginBottomPx = mmToPixels(marginBottom)
    
    const availableWidth = pageWidth - marginLeftPx - marginRightPx
    const availableHeight = pageHeight - marginTopPx - marginBottomPx
    const cellWidth = availableWidth / columns
    const cellHeight = availableHeight / rows

    const gridBoxes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = marginLeftPx + col * cellWidth
        const y = marginTopPx + row * cellHeight
        gridBoxes.push(
          <div
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: cellWidth,
              height: cellHeight,
              border: `1px solid ${outlineColor === 'red' ? 'rgba(255, 0, 0, 0.75)' : 
                       outlineColor === 'blue' ? 'rgba(0, 0, 255, 0.75)' :
                       outlineColor === 'green' ? 'rgba(0, 128, 0, 0.75)' :
                       outlineColor === 'white' ? 'rgba(255, 255, 255, 0.75)' :
                       'rgba(0, 0, 0, 0.75)'}`,
              boxSizing: 'border-box',
              pointerEvents: 'none'
            }}
          />
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
      <p>Turn PDF card sheets into individual cards for Probability</p>
      
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
            onChange={(e) => setMarginLeft(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
          />
        </label>
        <label>
          Margin Right (mm):
          <input
            type="number"
            value={marginRight}
            onChange={(e) => setMarginRight(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
          />
        </label>
        <label>
          Margin Top (mm):
          <input
            type="number"
            value={marginTop}
            onChange={(e) => setMarginTop(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
          />
        </label>
        <label>
          Margin Bottom (mm):
          <input
            type="number"
            value={marginBottom}
            onChange={(e) => setMarginBottom(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
            step="0.1"
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
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '2em' }}>
        <div style={{ flex: 1 }}>
          <span>{mode === 'single' ? 'Front/Back' : 'Front'}</span>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={onFile1Change} 
          />
          
          {file1 && (
            <Document 
              file={file1} 
              onLoadSuccess={onDocument1LoadSuccess}
            >
              {Array.from(new Array(numPages1), (el, index) => {
                const pageKey = `page1_${index + 1}`
                const dimensions = pageDimensions[pageKey]
                return (
                  <div key={pageKey} style={{ margin: '0 0 1em 0', padding: 0, display: 'inline-block', position: 'relative' }}>
                    <Page 
                      pageNumber={index + 1}
                      onRenderSuccess={() => {
                        setTimeout(() => {
                          const pageElement = document.querySelector(`[data-page-number="${index + 1}"]`) as HTMLElement
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
                      <div 
                        className="grid-overlay-container"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          pointerEvents: 'none'
                        }}
                      >
                        <GridOverlay pageWidth={dimensions.width} pageHeight={dimensions.height} />
                      </div>
                    )}
                  </div>
                )
              })}
            </Document>
          )}
        </div>

        {mode === 'separate' && (
          <div style={{ flex: 1 }}>
            <span>Back</span>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={onFile2Change} 
            />
            
            {file2 && (
              <Document 
                file={file2} 
                onLoadSuccess={onDocument2LoadSuccess}
              >
                {Array.from(new Array(numPages2), (el, index) => {
                  const pageKey = `page2_${index + 1}`
                  const dimensions = pageDimensions[pageKey]
                  return (
                    <div key={pageKey} style={{ margin: '0 0 1em 0', padding: 0, display: 'inline-block', position: 'relative' }}>
                      <Page 
                        pageNumber={index + 1}
                        onRenderSuccess={() => {
                          setTimeout(() => {
                            const pageElement = document.querySelector(`[data-page-number="${index + 1}"]`) as HTMLElement
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
                        <div 
                          className="grid-overlay-container"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            pointerEvents: 'none'
                          }}
                        >
                          <GridOverlay pageWidth={dimensions.width} pageHeight={dimensions.height} />
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
  )
}

export default App
