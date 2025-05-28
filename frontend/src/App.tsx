import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import OnBoardingPage from './pages/auth/OnBoardingPage'
import HomePage from './pages/home/HomePage'
import PublicRoute from './routes/PublicRoute'
import { AuthProvider } from './utils/AuthProvider'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
            
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<OnBoardingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Always accessible */}
          <Route path="/forgot-password" element={<ResetPasswordPage />} />

          {/* Private page (optional: wrap with PrivateRoute later) */}
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
