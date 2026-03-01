import { useState, useEffect } from 'react'
import { api } from '../api'
import ListingCard from '../components/ListingCard'

export default function WatchlistPage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.favorites()
      .then(async (favs) => {
        const ids = favs.map((f) => f.listing_id).filter(Boolean)
        const list = await Promise.all(ids.map((id) => api.listing(id).catch(() => null)))
        setListings(list.filter(Boolean))
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 24 }}>
      <h1>Дуртай</h1>
      {loading ? (
        <p>Уншиж байна...</p>
      ) : listings.length === 0 ? (
        <p>Дуртай зар байхгүй.</p>
      ) : (
        listings.map((l) => <ListingCard key={l.id} listing={l} />)
      )}
    </div>
  )
}
