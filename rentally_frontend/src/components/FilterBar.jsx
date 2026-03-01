export default function FilterBar({ filters, onChange }) {
  const { search, category, region, minPrice, maxPrice, tag } = filters
  return (
    <div style={s.wrap}>
      <input
        type="search"
        placeholder="Хайлт..."
        value={search || ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        style={s.input}
      />
      <select
        value={category || ''}
        onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
        style={s.select}
      >
        <option value="">Бүх төрөл</option>
        {(filters.categories || []).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        value={region || ''}
        onChange={(e) => onChange({ ...filters, region: e.target.value || undefined })}
        style={s.select}
      >
        <option value="">Бүх бүс</option>
        {(filters.regions || []).map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Min үнэ"
        value={minPrice || ''}
        onChange={(e) => onChange({ ...filters, minPrice: e.target.value || undefined })}
        style={s.input}
      />
      <input
        type="number"
        placeholder="Max үнэ"
        value={maxPrice || ''}
        onChange={(e) => onChange({ ...filters, maxPrice: e.target.value || undefined })}
        style={s.input}
      />
      <input
        type="text"
        placeholder="Шошго (parking, short_term)"
        value={tag || ''}
        onChange={(e) => onChange({ ...filters, tag: e.target.value || undefined })}
        style={s.input}
      />
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  input: { padding: 8, border: '1px solid var(--border)', borderRadius: 8, flex: '1 1 120px' },
  select: { padding: 8, border: '1px solid var(--border)', borderRadius: 8, minWidth: 120 },
}
