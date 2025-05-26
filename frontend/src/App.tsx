import { Route, BrowserRouter, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import OnBoardingPage from './pages/auth/OnBoardingPage'

// buat testing user-service
// import CreateUserPage from './pages/CreateUserPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnBoardingPage />} />
        {/* <Route path="/" element={<CreateUserPage />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ResetPasswordPage />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
