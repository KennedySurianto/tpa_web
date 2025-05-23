import './App.css'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import LandingPage from './pages/auth/LandingPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
