import { useAppStore } from './store'

export const MarginControls = () => {
  const {
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    marginUnit,
    setMarginLeft,
    setMarginRight,
    setMarginTop,
    setMarginBottom,
    setMarginUnit
  } = useAppStore()

  const unitLabel = marginUnit === 'mm' ? 'mm' : 'in'

  return (
    <div style={{ display: 'flex', gap: '1em', flexWrap: 'wrap', alignItems: 'center' }}>
      <label>
        Unit:
        <select
          value={marginUnit}
          onChange={(e) => setMarginUnit(e.target.value as 'mm' | 'inches')}
          style={{ marginLeft: '0.5em' }}
        >
          <option value="mm">Millimeters</option>
          <option value="inches">Inches</option>
        </select>
      </label>
      <label>
        Margin Left ({unitLabel}):
        <input
          type="number"
          value={marginLeft}
          onChange={(e) => setMarginLeft(Number(e.target.value))}
          style={{ marginLeft: '0.5em', width: '60px' }}
          step={marginUnit === 'mm' ? '0.1' : '0.01'}
        />
      </label>
      <label>
        Margin Right ({unitLabel}):
        <input
          type="number"
          value={marginRight}
          onChange={(e) => setMarginRight(Number(e.target.value))}
          style={{ marginLeft: '0.5em', width: '60px' }}
          step={marginUnit === 'mm' ? '0.1' : '0.01'}
        />
      </label>
      <label>
        Margin Top ({unitLabel}):
        <input
          type="number"
          value={marginTop}
          onChange={(e) => setMarginTop(Number(e.target.value))}
          style={{ marginLeft: '0.5em', width: '60px' }}
          step={marginUnit === 'mm' ? '0.1' : '0.01'}
        />
      </label>
      <label>
        Margin Bottom ({unitLabel}):
        <input
          type="number"
          value={marginBottom}
          onChange={(e) => setMarginBottom(Number(e.target.value))}
          style={{ marginLeft: '0.5em', width: '60px' }}
          step={marginUnit === 'mm' ? '0.1' : '0.01'}
        />
      </label>
    </div>
  )
}