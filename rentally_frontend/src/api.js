const BASE = '/api'
const token = () => localStorage.getItem('rentally_token')

async function fetchAPI(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const t = token()
  if (t) headers['Authorization'] = `Bearer ${t}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = new Error(res.statusText)
    err.status = res.status
    err.data = await res.json().catch(() => ({}))
    throw err
  }
  return res.json()
}

export const api = {
  listings: (params = {}) => fetchAPI('/listings/' + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '')),
  listing: (id) => fetchAPI(`/listings/${id}/`),
  listingDetails: (id) => fetchAPI(`/listing-details/${id}/`),
  listingImages: (id) => fetchAPI(`/listing-images/?listing_id=${id}`),
  categories: () => fetchAPI('/categories/'),
  regions: () => fetchAPI('/regions/'),
  mongoliaCities: () => fetchAPI('/mongolia/cities/'),
  popularAreas: () => fetchAPI('/mongolia/popular-areas/'),
  neighborhoods: () => fetchAPI('/mongolia/neighborhoods/'),
  utilityEstimate: (area) => fetchAPI(`/mongolia/utility-estimate/?area_sqm=${area || ''}`),
  messages: (params = {}) => fetchAPI('/messages/' + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '')),
  sendMessage: (d) => fetchAPI('/messages/', { method: 'POST', body: JSON.stringify(d) }),
  register: (d) => fetchAPI('/auth/register/', { method: 'POST', body: JSON.stringify(d) }),
  brokerRegister: (d) => fetchAPI('/auth/broker-register/', { method: 'POST', body: JSON.stringify(d) }),
  token: (d) => fetchAPI('/token/', { method: 'POST', body: JSON.stringify(d) }),
  favorites: () => fetchAPI('/favorites/'),
  addFavorite: (listingId) => fetchAPI('/favorites/', { method: 'POST', body: JSON.stringify({ listing: listingId }) }),
  removeFavorite: (listingId) => fetchAPI(`/favorites/${listingId}/`, { method: 'DELETE' }),
}
