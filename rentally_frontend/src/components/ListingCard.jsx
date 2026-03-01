import { Link } from 'react-router-dom'
import { formatMNT } from '../locale'

export default function ListingCard({ listing, onFavorite, isFavorite }) {
  const img = listing?.image_url || 'https://placehold.co/400x200/1a365d/fff?text=Rentally'
  return (
    <Link to={`/listing/${listing?.id}`} style={s.card}>
      <div style={s.imgWrap}>
        <img src={img} alt="" style={s.img} />
      </div>
      <div style={s.body}>
        <div style={s.price}>{formatMNT(listing?.price, true)}</div>
        <div style={s.title}>{listing?.title || 'Байр'}</div>
        {listing?.address && <div style={s.addr}>{listing.address}</div>}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onFavorite?.(listing?.id) }}
          style={s.heart}
          title="Дуртай"
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>
    </Link>
  )
}

const s = {
  card: {
    display: 'block',
    background: '#fff',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow)',
    marginBottom: 12,
    position: 'relative',
  },
  imgWrap: { aspectRatio: '4/3', overflow: 'hidden', background: '#e2e8f0' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  body: { padding: 12 },
  price: { fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' },
  title: { fontSize: '0.95rem', marginTop: 4 },
  addr: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    border: 'none',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '50%',
    width: 32,
    height: 32,
    cursor: 'pointer',
    fontSize: 16,
  },
}
