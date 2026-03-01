import { useState } from 'react'
import { api } from '../api'
import { labels } from '../locale'

export default function MessageInquiry({ listingId, receiverId, listingTitle }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const senderId = 1 // TODO: from auth

  const handleSend = async () => {
    if (!message.trim() || !receiverId || !listingId) return
    setLoading(true)
    try {
      await api.sendMessage({
        sender_id: senderId,
        receiver_id: receiverId,
        listing_id: listingId,
        message: message.trim(),
      })
      setSent(true)
      setMessage('')
    } catch {
      setSent(false)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <p style={{ color: 'green' }}>Мессеж илгээгдлээ.</p>

  return (
    <div style={s.wrap}>
      <h3>{labels.viewContact}</h3>
      <p style={s.note}>“{listingTitle}” – талаас асуулт илгээх</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Мессеж бичих..."
        rows={3}
        style={s.textarea}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={loading || !message.trim()}
        style={s.btn}
      >
        {loading ? 'Илгээж байна...' : 'Мессеж илгээх'}
      </button>
    </div>
  )
}

const s = {
  wrap: { padding: 16, background: '#fff', borderRadius: 'var(--radius)', marginTop: 12 },
  note: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 },
  textarea: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 },
  btn: {
    padding: '10px 20px',
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
}
