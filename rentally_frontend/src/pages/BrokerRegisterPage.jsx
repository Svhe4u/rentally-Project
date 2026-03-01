import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function BrokerRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' })
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await api.brokerRegister(form)
      navigate('/login')
    } catch (x) {
      setErr(x.data?.detail || x.message || 'Алдаа')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 24 }}>
      <h1>Зууч регистр</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Нэр"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          style={s.input}
        />
        <input
          type="email"
          placeholder="Имэйл"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          style={s.input}
        />
        <input
          type="tel"
          placeholder="Утас"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
        <button type="submit" style={s.btn}>Зууч болж бүртгүүлэх</button>
      </form>
    </div>
  )
}

const s = {
  input: { display: 'block', width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid var(--border)' },
  btn: { padding: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, width: '100%' },
}
