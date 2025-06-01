// src/pages/LoginPage.tsx

import React, { useState } from "react";
import { AuthServiceClientImpl, LoginRequest } from "../../api/gen/auth";
import { GrpcWebImpl } from "../../api/gen/auth";
import { BrowserHeaders } from "browser-headers";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
});

const authClient = new AuthServiceClientImpl(transport);

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear error when user starts typing
    if (error) setError("");
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const loginRequest: LoginRequest = {
      email: formData.email,
      password: formData.password,
      rememberMe: rememberMe,
      deviceInfo: navigator.userAgent
    };

    try {
      const response = await authClient.Login(loginRequest);

      if (response.success) {
        console.log("Login successful:", response);

        login(response);

        // Navigate to home page
        navigate("/home");
      } else {
        setError(response.message || response.error || "Login failed. Please check your credentials.");
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
    <div className="d-flex align-center justify-center" style={{ minHeight: "100vh" }}>
      <div className="container">
        <div className="row justify-center">
          <div className="col-12 col-sm-8 col-md-6 col-lg-4">
            <div className="text-center p-4">
              {/* Header */}
              <div className="mb-4">
                <h1 className="mb-2">Login to SurVace</h1>
                <p className="mb-4">Welcome back! Please sign in to your account.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div 
                  className="mb-4 p-3"
                  style={{
                    backgroundColor: "#fee",
                    border: "1px solid #fcc",
                    borderRadius: "4px",
                    color: "#c33"
                  }}
                >
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="mb-3">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-100 p-3"
                    style={{
                      border: "1px solid #000",
                      background: "#fff",
                      opacity: isLoading ? 0.6 : 1
                    }}
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-100 p-3"
                    style={{
                      border: "1px solid #000",
                      background: "#fff",
                      opacity: isLoading ? 0.6 : 1
                    }}
                  />
                </div>

                <div className="d-flex justify-between align-center mb-3">
                  <label className="d-flex align-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      disabled={isLoading}
                    />
                    Remember me
                  </label>
                  <Link 
                    to="/forgot-password"
                    style={{
                      color: "#000",
                      textDecoration: "underline"
                    }}
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-100 p-3 mb-3"
                  style={{
                    border: "1px solid #000",
                    background: isLoading ? "#666" : "#000",
                    color: "#fff",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-3">
                <span>or</span>
              </div>

              {/* Google Login */}
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-100 mb-4 p-3"
                style={{
                  border: "1px solid #000",
                  background: "#fff",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                Continue with Google
              </button>

              {/* Register Link */}
              <div className="text-center">
                <span>Don't have an account? </span>
                <Link 
                  to="/register"
                  style={{
                    color: "#000",
                    textDecoration: "underline"
                  }}
                >
                  Sign up
                </Link>
              </div>

              {/* Back to Home */}
              <div className="mt-3">
                <Link 
                  to="/"
                  style={{
                    color: "#000",
                    textDecoration: "underline"
                  }}
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;