import { Link } from 'react-router-dom'
import { labels } from '../locale'

export default function Header() {
  return (
    <header style={s.header}>
      <Link to="/" style={s.logo}>Rentally</Link>
      <nav style={s.nav}>
        <Link to="/">Газрын зураг</Link>
        <Link to="/watchlist">{labels.watchlist}</Link>
        <Link to="/my-listings">{labels.ourHouse}</Link>
        <Link to="/login">{labels.login}</Link>
        <Link to="/register">{labels.join}</Link>
        <Link to="/broker-register">{labels.brokerRegister}</Link>
      </nav>
    </header>
  )
}

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#fff',
    borderBottom: '1px solid var(--border)',
  },
  logo: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' },
  nav: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 },
}
