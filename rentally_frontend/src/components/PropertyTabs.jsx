export default function PropertyTabs({ tabs, active, onSelect }) {
  return (
    <div style={s.wrap}>
      {(tabs || []).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          style={{ ...s.tab, ...(active === t.id ? s.active : {}) }}
        >
          {t.name}
        </button>
      ))}
    </div>
  )
}

const s = {
  wrap: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  tab: {
    padding: '8px 16px',
    border: '1px solid var(--border)',
    background: '#fff',
    borderRadius: 8,
    cursor: 'pointer',
  },
  active: { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' },
}
