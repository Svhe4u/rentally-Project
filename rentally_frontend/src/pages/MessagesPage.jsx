import { useState, useEffect } from 'react'
import { api } from '../api'

const MY_USER_ID = 1

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.messages({ receiver_id: MY_USER_ID })
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 24 }}>
      <h1>Мессежүүд</h1>
      {loading ? (
        <p>Уншиж байна...</p>
      ) : messages.length === 0 ? (
        <p>Мессеж байхгүй.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {messages.map((m) => (
            <li key={m.id} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              <strong>Зар #{m.listing_id}</strong>: {m.message?.slice(0, 80)}...
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
