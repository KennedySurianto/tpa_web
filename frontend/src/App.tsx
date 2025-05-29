import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import OnBoardingPage from './pages/auth/OnBoardingPage'
import PublicRoute from './routes/PublicRoute'
import { AuthProvider } from './utils/AuthProvider'
import Layout from './pages/home/Layout'
import VideoFeed from './pages/home/components/VideoFeed'
import UploadVideoPage from './pages/home/UploadVideoPage'

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

          <Route element={<Layout />} >
            <Route path="/home" element={<VideoFeed />} />
            <Route path="/upload" element={<UploadVideoPage />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
