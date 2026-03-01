import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const r = await api.token(form)
      localStorage.setItem('rentally_token', r.access)
      navigate('/')
    } catch (x) {
      setErr(x.data?.detail || x.message || 'Нэвтрэх амжилтгүй')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 24 }}>
      <h1>Нэвтрэх</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Нэр"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          style={s.input}
        />
        <input
          type="password"
          placeholder="Нууц үг"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          style={s.input}
        />
        {err && <p style={{ color: 'red' }}>{err}</p>}
        <button type="submit" style={s.btn}>Нэвтрэх</button>
      </form>
    </div>
  )
}

const s = {
  input: { display: 'block', width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid var(--border)' },
  btn: { padding: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, width: '100%' },
}
