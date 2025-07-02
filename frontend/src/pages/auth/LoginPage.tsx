import type React from "react";
import { useState } from "react";
import { LoginRequest } from "../../api/gen/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Chrome,
  Sparkles,
} from "lucide-react";
import { authClient } from "../../api/grpc/authClient";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateField = (name: string, value: string) => {
    const errors: { [key: string]: string } = {};

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) {
        errors.email = "Email is required";
      } else if (!emailRegex.test(value)) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (name === "password") {
      if (!value) {
        errors.password = "Password is required";
      } else if (value.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    }

    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (error) setError("");

    // Clear field-specific errors
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    const errors = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, ...errors }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all fields
    const emailErrors = validateField("email", formData.email);
    const passwordErrors = validateField("password", formData.password);
    const allErrors = { ...emailErrors, ...passwordErrors };

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      return;
    }

    setIsLoading(true);

    const loginRequest: LoginRequest = {
      email: formData.email,
      password: formData.password,
      rememberMe: rememberMe,
      deviceInfo: navigator.userAgent,
    };

    try {
      const response = await authClient.Login(loginRequest);
      if (response.success) {
        console.log("Login successful:", response);
        login(response);
        navigate("/home");
      } else {
        setError(
          response.message || response.error || "Login failed. Please check your credentials.",
        );
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    // Implement Google OAuth login logic here
  };

  return (
    <div className="login-container">
      {/* Background Elements */}
      <div className="background-gradient"></div>
      <div className="background-pattern"></div>

      <div className="content-wrapper">
        <div className="login-card">
          {/* Header */}
          <div className="header-section">
            <div className="logo-container">
              <div className="logo-icon">
                <Sparkles size={24} />
              </div>
              <h1 className="page-title">Welcome Back</h1>
            </div>
            <p className="page-subtitle">Sign in to your SurVace account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div
                className={`input-container ${fieldErrors.email ? "error" : ""} ${formData.email ? "filled" : ""}`}
              >
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="form-input"
                />
                {formData.email && !fieldErrors.email && (
                  <CheckCircle size={16} className="success-icon" />
                )}
              </div>
              {fieldErrors.email && (
                <div className="field-error">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div
                className={`input-container ${fieldErrors.password ? "error" : ""} ${formData.password ? "filled" : ""}`}
              >
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="field-error">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  disabled={isLoading}
                  className="checkbox-input"
                />
                <div className="checkbox-custom">{rememberMe && <CheckCircle size={12} />}</div>
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || Object.keys(fieldErrors).some((key) => fieldErrors[key])}
              className={`submit-button ${isLoading ? "loading" : ""}`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="loading-spinner" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span className="divider-text">or continue with</span>
          </div>

          {/* Google Login */}
          <button onClick={handleGoogleLogin} disabled={isLoading} className="google-button">
            <Chrome size={18} />
            <span>Continue with Google</span>
          </button>

          {/* Footer Links */}
          <div className="footer-links">
            <div className="register-link">
              <span>Don't have an account? </span>
              <Link to="/register" className="link">
                Sign up
              </Link>
            </div>

            <Link to="/" className="back-link">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .login-container {
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
                      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
          z-index: -1;
        }

        .content-wrapper {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        .login-card {
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

        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        }

        .header-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .logo-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 15px 30px rgba(59, 130, 246, 0.3);
        }

        .page-title {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff, #e5e7eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          margin: 0;
          color: #9ca3af;
          font-size: 0.95rem;
          font-weight: 400;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.875rem;
          color: #fca5a5;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          animation: shake 0.5s ease-in-out;
        }

        .login-form {
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          color: #d1d5db;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.875rem;
          transition: all 0.3s ease;
        }

        .input-container:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .input-container.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .input-container.filled {
          background: rgba(255, 255, 255, 0.08);
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #9ca3af;
          pointer-events: none;
          z-index: 1;
        }

        .success-icon {
          position: absolute;
          right: 1rem;
          color: #10b981;
          pointer-events: none;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
        }

        .form-input::placeholder {
          color: #6b7280;
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .password-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .field-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fca5a5;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          padding-left: 0.25rem;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          color: #d1d5db;
          font-size: 0.875rem;
          font-weight: 400;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border: 2px solid #6b7280;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: transparent;
        }

        .checkbox-label:hover .checkbox-custom {
          border-color: #9ca3af;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #ffffff;
        }

        .forgot-link {
          color: #3b82f6;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .forgot-link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        .submit-button {
          width: 100%;
          padding: 1.125rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 0.875rem;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 2rem 0;
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

        .google-button {
          width: 100%;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.875rem;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .google-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .google-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }

        .register-link {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #6b7280;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .back-link:hover {
          color: #9ca3af;
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .login-container {
            padding: 1.5rem 1rem;
          }

          .login-card {
            padding: 2.5rem 2rem;
            border-radius: 1.5rem;
          }

          .logo-icon {
            width: 50px;
            height: 50px;
          }

          .page-title {
            font-size: 1.75rem;
          }

          .form-input {
            padding: 0.875rem 0.875rem 0.875rem 2.75rem;
            font-size: 0.9rem;
          }

          .submit-button {
            padding: 1rem 1.25rem;
            font-size: 0.95rem;
          }
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 1rem 0.75rem;
          }

          .login-card {
            padding: 2rem 1.5rem;
          }

          .form-options {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .page-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
