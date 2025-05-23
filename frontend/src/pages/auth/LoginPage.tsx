// src/pages/LoginPage.tsx

import React, { useState } from "react";
import { Link } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", formData);
    // Implement login logic here
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
                    className="w-100 p-3"
                    style={{
                      border: "1px solid #000",
                      background: "#fff"
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
                    className="w-100 p-3"
                    style={{
                      border: "1px solid #000",
                      background: "#fff"
                    }}
                  />
                </div>

                <div className="d-flex justify-between align-center mb-3">
                  <label className="d-flex align-center">
                    <input type="checkbox" className="mr-2" />
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
                  className="w-100 p-3 mb-3"
                  style={{
                    border: "1px solid #000",
                    background: "#000",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  Sign In
                </button>
              </form>

              {/* Divider */}
              <div className="my-3">
                <span>or</span>
              </div>

              {/* Google Login */}
              <button 
                onClick={handleGoogleLogin}
                className="w-100 mb-4 p-3"
                style={{
                  border: "1px solid #000",
                  background: "#fff",
                  cursor: "pointer"
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