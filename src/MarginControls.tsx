import { useAppStore } from './store'

export const MarginControls = () => {
  const {
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    marginUnit,
    update,
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
          onChange={(e) => update('marginLeft', Number(e.target.value))}
          style={{ marginLeft: '0.5em', width: '60px' }}
          step={marginUnit === 'mm' ? '0.1' : '0.01'}
        />
      </label>
      <label>
        Margin Right ({unitLabel}):
        <input
          type="number"
          value={marginRight}
          onChange={(e) => update('marginRight', Number(e.target.value))}
          style={{ marginLeft: '0.5em', width: '60px' }}
          step={marginUnit === 'mm' ? '0.1' : '0.01'}
        />
      </label>
      <label>
        Margin Top ({unitLabel}):
        <input
          type="number"
          value={marginTop}
          onChange={(e) => update('marginTop', Number(e.target.value))}
          style={{ marginLeft: '0.5em', width: '60px' }}
          step={marginUnit === 'mm' ? '0.1' : '0.01'}
        />
      </label>
      <label>
        Margin Bottom ({unitLabel}):
        <input
          type="number"
          value={marginBottom}
          onChange={(e) => update('marginBottom', Number(e.target.value))}
          style={{ marginLeft: '0.5em', width: '60px' }}
          step={marginUnit === 'mm' ? '0.1' : '0.01'}
        />
      </label>
    </div>
  )
}