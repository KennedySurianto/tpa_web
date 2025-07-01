import type React from "react"
import { Link, useNavigate } from "react-router-dom"
import { LogIn, UserPlus, Users, ArrowRight, Sparkles } from "lucide-react"

const OnBoardingPage: React.FC = () => {
  const navigate = useNavigate()

  const handleContinueAsGuest = () => {
    navigate("/home")
  }

  return (
    <div className="onboarding-container">
      {/* Background Elements */}
      <div className="background-gradient"></div>
      <div className="background-pattern"></div>

      <div className="content-wrapper">
        <div className="onboarding-card">
          {/* Logo/Brand Section */}
          <div className="brand-section">
            <div className="logo-container">
              <div className="logo-icon">
                <Sparkles size={32} />
              </div>
              <h1 className="brand-title">SurVace</h1>
            </div>
            <p className="brand-subtitle">Connect, Share, and Discover Amazing Content</p>
          </div>

          {/* Action Buttons */}
          <div className="actions-section">
            {/* Login Button */}
            <Link to="/login" className="action-button primary">
              <LogIn size={20} />
              <span>Login to Your Account</span>
              <ArrowRight size={16} className="arrow-icon" />
            </Link>

            {/* Register Button */}
            <Link to="/register" className="action-button secondary">
              <UserPlus size={20} />
              <span>Create New Account</span>
              <ArrowRight size={16} className="arrow-icon" />
            </Link>

            {/* Divider */}
            <div className="divider">
              <span className="divider-text">or</span>
            </div>

            {/* Continue as Guest */}
            <button onClick={handleContinueAsGuest} className="guest-button">
              <Users size={18} />
              <span>Continue as Guest</span>
            </button>
          </div>

          {/* Features Preview */}
          <div className="features-preview">
            <div className="feature-item">
              <div className="feature-dot"></div>
              <span>Watch trending videos</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot"></div>
              <span>Connect with friends</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot"></div>
              <span>Share your moments</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .onboarding-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .background-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a1a3a 100%);
          z-index: -2;
        }

        .background-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
          z-index: -1;
        }

        .content-wrapper {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        .onboarding-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 2rem;
          padding: 3rem 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideInUp 0.8s ease-out;
          position: relative;
          overflow: hidden;
        }

        .onboarding-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        }

        .brand-section {
          text-align: center;
          margin-bottom: 3rem;
        }

        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
          animation: float 3s ease-in-out infinite;
        }

        .brand-title {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff, #e5e7eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .brand-subtitle {
          margin: 0;
          color: #9ca3af;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
        }

        .actions-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-radius: 1rem;
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
        }

        .action-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .action-button:hover::before {
          left: 100%;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #ffffff;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }

        .action-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
        }

        .action-button.secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .action-button.secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .action-button span {
          flex: 1;
          text-align: left;
          margin-left: 0.75rem;
        }

        .arrow-icon {
          opacity: 0.7;
          transition: all 0.3s ease;
        }

        .action-button:hover .arrow-icon {
          opacity: 1;
          transform: translateX(4px);
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          position: relative;
        }

        .divider::before {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .divider-text {
          padding: 0 1.5rem;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          background: rgba(26, 26, 26, 0.8);
        }

        .guest-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.875rem;
          color: #d1d5db;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .guest-button:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .features-preview {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 400;
        }

        .feature-dot {
          width: 6px;
          height: 6px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          flex-shrink: 0;
        }

        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @media (max-width: 768px) {
          .onboarding-container {
            padding: 1.5rem 1rem;
          }

          .onboarding-card {
            padding: 2.5rem 2rem;
            border-radius: 1.5rem;
          }

          .logo-icon {
            width: 70px;
            height: 70px;
          }

          .brand-title {
            font-size: 2.25rem;
          }

          .brand-subtitle {
            font-size: 0.9rem;
          }

          .action-button {
            padding: 1.125rem 1.25rem;
            font-size: 0.95rem;
          }

          .action-button span {
            margin-left: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .onboarding-container {
            padding: 1rem 0.75rem;
          }

          .onboarding-card {
            padding: 2rem 1.5rem;
          }

          .logo-icon {
            width: 60px;
            height: 60px;
          }

          .brand-title {
            font-size: 2rem;
          }

          .action-button {
            padding: 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  )
}

export default OnBoardingPage
