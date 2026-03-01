import { useState, useEffect } from 'react'
import { api } from '../api'
import ListingCard from '../components/ListingCard'

// owner_id from auth - for demo use 1
const MY_OWNER_ID = 1

export default function MyListingsPage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listings({ owner_id: MY_OWNER_ID })
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 24 }}>
      <h1>Манай байр</h1>
      {loading ? (
        <p>Уншиж байна...</p>
      ) : listings.length === 0 ? (
        <p>Одоогоор зар байхгүй.</p>
      ) : (
        listings.map((l) => <ListingCard key={l.id} listing={l} />)
      )}
    </div>
  )
}
