import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { formatMNT, labels } from '../locale'
import MessageInquiry from '../components/MessageInquiry'

export default function ListingDetailPage() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [details, setDetails] = useState(null)
  const [images, setImages] = useState([])
  const [utilityEst, setUtilityEst] = useState(null)

  useEffect(() => {
    Promise.all([
      api.listing(id),
      api.listingDetails(id).catch(() => null),
    ]).then(([l, d]) => {
      setListing(l)
      setDetails(d)
      const area = d?.area_sqm ?? l?.area_sqm ?? 60
      api.utilityEstimate(area).then(setUtilityEst).catch(() => {})
    }).catch(() => setListing(null))
    api.listingImages(id).then(setImages).catch(() => [])
  }, [id])

  if (!listing) return <div style={{ padding: 32 }}>Олдсонгүй.</div>

  const area = details?.area_sqm ?? listing?.area_sqm
  const price = Number(listing.price) || 0
  const pricePerSqm = area ? Math.round(price / area) : null
  const imgList = images?.length ? images : [{ image_url: 'https://placehold.co/800x400/1a365d/fff?text=Rentally' }]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>#{listing.id}</div>
      <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: 12, marginTop: 8 }}>
        <img src={imgList[0]?.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h1 style={{ marginTop: 16 }}>{formatMNT(price)}</h1>
      <p style={{ color: 'var(--text-muted)' }}>{listing.description?.slice(0, 100) || 'Орон сууц'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <div>Талбай: {area ? `${area} м²` : '–'}</div>
        <div>Давхар: {details?.floor_number ?? '–'}</div>
        {pricePerSqm && <div>м² тутамд: {formatMNT(pricePerSqm)}</div>}
      </div>
      <section style={{ marginTop: 24 }}>
        <h2>Үнийн мэдээлэл</h2>
        <p>Үнэ: {formatMNT(price)}</p>
        {utilityEst && (
          <p>Дулаан/цахилгаан: {formatMNT(utilityEst.estimated_monthly_mnt?.min)} – {formatMNT(utilityEst.estimated_monthly_mnt?.max)}</p>
        )}
      </section>
      <MessageInquiry
        listingId={Number(id)}
        receiverId={listing.owner_id}
        listingTitle={listing.title}
      />
    </div>
  )
}
