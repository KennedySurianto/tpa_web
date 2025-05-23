// src/pages/ResetPasswordPage.tsx

import React, { useState } from "react";
import { Link } from "react-router-dom";

const ResetPasswordPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    verificationCode: "",
    newPassword: ""
  });

  const [isPhoneReset, setIsPhoneReset] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Reset password attempt:", formData);
    // Implement password reset logic here
  };

  const handleSendCode = () => {
    console.log("Send verification code to:", formData.email);
    // Implement send code logic here
  };

  return (
    <div className="d-flex align-center justify-center" style={{ minHeight: "100vh" }}>
      <div className="container">
        <div className="row justify-center">
          <div className="col-12 col-sm-8 col-md-6 col-lg-4">
            <div className="p-4">
              {/* Header */}
              <div className="text-center mb-4">
                <h1 className="mb-3">Reset password</h1>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Email/Phone Toggle */}
                <div className="mb-3">
                  <div className="d-flex mb-2">
                    <button
                      type="button"
                      onClick={() => setIsPhoneReset(false)}
                      className="mr-3"
                      style={{
                        background: "none",
                        border: "none",
                        textDecoration: !isPhoneReset ? "underline" : "none",
                        fontWeight: !isPhoneReset ? "bold" : "normal",
                        cursor: "pointer",
                        fontSize: "0.875rem"
                      }}
                    >
                      Enter email address
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPhoneReset(true)}
                      style={{
                        background: "none",
                        border: "none",
                        textDecoration: isPhoneReset ? "underline" : "none",
                        fontWeight: isPhoneReset ? "bold" : "normal",
                        cursor: "pointer",
                        fontSize: "0.875rem"
                      }}
                    >
                      Reset with phone number
                    </button>
                  </div>

                  <input
                    type={isPhoneReset ? "tel" : "email"}
                    name="email"
                    placeholder={isPhoneReset ? "Phone number" : "Email address"}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-100 p-3 mb-3"
                    style={{
                      border: "1px solid #ccc",
                      background: "#f5f5f5"
                    }}
                  />
                </div>

                {/* Verification Code */}
                <div className="row mb-3">
                  <div className="col-8">
                    <input
                      type="text"
                      name="verificationCode"
                      placeholder="Enter 6-digit code"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      className="w-100 p-3"
                      style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5"
                      }}
                      maxLength={6}
                    />
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      onClick={handleSendCode}
                      className="w-100 p-3"
                      style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        cursor: "pointer"
                      }}
                    >
                      Send code
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <div className="position-relative">
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      className="w-100 p-3"
                      style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5"
                      }}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-100 p-3 mb-4"
                  style={{
                    border: "1px solid #ccc",
                    background: "#f5f5f5",
                    cursor: "pointer"
                  }}
                >
                  Log in
                </button>
              </form>

              {/* Back to Login */}
              <div className="text-center">
                <Link 
                  to="/login"
                  style={{
                    color: "#000",
                    textDecoration: "underline"
                  }}
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;