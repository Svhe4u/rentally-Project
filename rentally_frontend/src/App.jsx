import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import ListingDetailPage from './pages/ListingDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BrokerRegisterPage from './pages/BrokerRegisterPage'
import MyListingsPage from './pages/MyListingsPage'
import WatchlistPage from './pages/WatchlistPage'
import MessagesPage from './pages/MessagesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/broker-register" element={<BrokerRegisterPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
