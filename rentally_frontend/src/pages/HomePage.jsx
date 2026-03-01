import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import ListingCard from '../components/ListingCard'
import MapView from '../components/MapView'
import FilterBar from '../components/FilterBar'
import PropertyTabs from '../components/PropertyTabs'

const ULAANBAATAR = [47.9212, 106.9186]

export default function HomePage() {
  const [listings, setListings] = useState([])
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [popularAreas, setPopularAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    region: '',
    minPrice: '',
    maxPrice: '',
    tag: '',
    categories: [],
    regions: [],
  })
  const [activeTab, setActiveTab] = useState(null)
  const [ownerFilter, setOwnerFilter] = useState(null)

  const fetchListings = useCallback(() => {
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.category) params.category = filters.category
    if (filters.region) params.region = filters.region
    if (filters.minPrice) params.min_price = filters.minPrice
    if (filters.maxPrice) params.max_price = filters.maxPrice
    if (filters.tag) params.tag = filters.tag
    if (ownerFilter) params.owner_id = ownerFilter
    api.listings(params)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [filters, ownerFilter])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  useEffect(() => {
    api.categories().then((r) => setFilters((f) => ({ ...f, categories: r }))).catch(() => {})
    api.regions().then((r) => setFilters((f) => ({ ...f, regions: r }))).catch(() => {})
    api.popularAreas().then((r) => setPopularAreas(r.areas || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab) setFilters((f) => ({ ...f, category: activeTab }))
  }, [activeTab])

  const selectedListing = listings.find((l) => l.id === selectedId)
  const mapCenter = selectedListing?.latitude && selectedListing?.longitude
    ? [selectedListing.latitude, selectedListing.longitude]
    : ULAANBAATAR

  return (
    <div style={s.layout} className="home-layout">
      <aside style={s.listPanel}>
        <FilterBar filters={filters} onChange={setFilters} />
        <PropertyTabs
          tabs={categories}
          active={activeTab}
          onSelect={(id) => setActiveTab(id === activeTab ? null : id)}
        />
        {popularAreas.length > 0 && (
          <div style={s.popular}>
            <strong>Түгээмэл бүс:</strong>
            {popularAreas.slice(0, 5).map((a) => (
              <span key={a.id} style={s.tag}>{a.name} ({a.listing_count})</span>
            ))}
          </div>
        )}
        {loading ? (
          <p>Уншиж байна...</p>
        ) : listings.length === 0 ? (
          <p>Зар олдсонгүй.</p>
        ) : (
          <div style={s.list}>
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onSelect={() => setSelectedId(l.id)}
                isFavorite={false}
              />
            ))}
          </div>
        )}
      </aside>
      <section style={s.mapPanel}>
        <MapView
          listings={listings}
          selectedId={selectedId}
          onSelect={setSelectedId}
          center={mapCenter}
        />
      </section>
    </div>
  )
}

const s = {
  layout: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    height: 'calc(100vh - 52px)',
    overflow: 'hidden',
  },
  listPanel: {
    overflowY: 'auto',
    padding: 16,
    borderRight: '1px solid var(--border)',
  },
  mapPanel: { minHeight: 0 },
  list: {},
  popular: { marginBottom: 12, fontSize: 14 },
  tag: { marginRight: 8, color: 'var(--text-muted)' },
}
