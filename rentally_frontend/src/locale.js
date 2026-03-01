export const CURRENCY = '₮'
export function formatMNT(amount, compact = false) {
  if (amount == null || isNaN(amount)) return '–'
  const n = Number(amount)
  if (compact && n >= 1e6) return `${(n / 1e6).toFixed(1)} сая ${CURRENCY}`
  return `${n.toLocaleString('mn-MN').replace(/,/g, ' ')} ${CURRENCY}`
}
export const labels = {
  search: 'Хайлт', filter: 'Шүүлт', map: 'Газрын зураг', watchlist: 'Дуртай',
  ourHouse: 'Манай байр', login: 'Нэвтрэх', join: 'Бүртгүүлэх',
  brokerRegister: 'Зууч регистр', viewContact: 'Холбогдох', popularAreas: 'Түгээмэл бүс',
}
