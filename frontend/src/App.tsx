import { Route, BrowserRouter, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import OnBoardingPage from './pages/auth/OnBoardingPage'
import HomePage from './pages/home/HomePage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnBoardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ResetPasswordPage />}/>
        <Route path="/home" element={<HomePage />}/>

      </Routes>
    </BrowserRouter>
  )
}

export default App
