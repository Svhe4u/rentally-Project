import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { formatMNT } from '../locale'

export default function MapView({ listings = [], selectedId, onSelect, center, zoom = 12 }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return
    const map = L.map(mapRef.current).setView(
      center || [47.9212, 106.9186],
      zoom
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const markers = []
    const withCoords = listings.filter((l) => l.latitude && l.longitude)
    withCoords.forEach((listing) => {
      const m = L.marker([listing.latitude, listing.longitude])
        .addTo(map)
        .bindPopup(`<b>${listing.title || 'Зар'}</b><br>${formatMNT(listing.price, true)}`)
      m.on('click', () => onSelect?.(listing.id))
      markers.push(m)
    })
    return () => markers.forEach((m) => m.remove())
  }, [listings, onSelect])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !center) return
    map.setView(center, zoom)
  }, [center, zoom])

  return <div ref={mapRef} style={{ height: '100%', minHeight: 300 }} />
}
