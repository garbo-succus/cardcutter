import { useState } from 'react'
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

  return (
    <div>
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
          Margin Left:
          <input
            type="number"
            value={marginLeft}
            onChange={(e) => setMarginLeft(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
          />
        </label>
        <label>
          Margin Right:
          <input
            type="number"
            value={marginRight}
            onChange={(e) => setMarginRight(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
          />
        </label>
        <label>
          Margin Top:
          <input
            type="number"
            value={marginTop}
            onChange={(e) => setMarginTop(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
          />
        </label>
        <label>
          Margin Bottom:
          <input
            type="number"
            value={marginBottom}
            onChange={(e) => setMarginBottom(Number(e.target.value))}
            style={{ marginLeft: '0.5em', width: '60px' }}
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
              {Array.from(new Array(numPages1), (el, index) => (
                <div key={`page1_${index + 1}`} style={{ margin: '0 0 1em 0', padding: 0, display: 'block' }}>
                  <Page pageNumber={index + 1} />
                </div>
              ))}
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
                {Array.from(new Array(numPages2), (el, index) => (
                  <div key={`page2_${index + 1}`} style={{ margin: '0 0 1em 0', padding: 0, display: 'block' }}>
                    <Page pageNumber={index + 1} />
                  </div>
                ))}
              </Document>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
