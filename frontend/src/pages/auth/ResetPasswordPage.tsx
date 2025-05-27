// src/pages/ResetPasswordPage.tsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthServiceClientImpl, GrpcWebImpl, ResetPasswordRequest } from "../../grpc/gen/auth";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

const authClient = new AuthServiceClientImpl(transport);

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: ""
  });

  const [isPhoneReset, setIsPhoneReset] = useState(false);
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSendCode = async () => {
    if (!formData.email) {
      setError("Please enter your email address first");
      return;
    }

    setSendingOtp(true);
    setError("");
    console.log("Send verification code to:", formData.email);
    
    try {
      const response = await authClient.SendOTP({
        email: formData.email
      });
      
      setOtpSent(true);
      console.log("OTP sent successfully:", response.message);
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Failed to send verification code";
      setError(errorMessage);
      console.error("Failed to send verification code:", err);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setVerifyingOtp(true);
    setError("");
    
    try {
      const response = await authClient.VerifyOTP({
        email: formData.email,
        otp: formData.otp
      });
      
      if (response.success) {
        setOtpVerified(true);
        console.log("OTP verified successfully:", response.message);
      } else {
        setError(response.message || "Invalid verification code");
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Failed to verify code";
      setError(errorMessage);
      console.error("Failed to verify OTP:", err);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendCode = async () => {
    setFormData(prev => ({ ...prev, otp: "" }));
    setOtpVerified(false);
    await handleSendCode();
  };

  const handleResetPassword = async () => {
    if (!formData.newPassword) {
      setError("Please enter a new password");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!otpVerified) {
      setError("Please verify your code first");
      return;
    }

    setResettingPassword(true);
    setError("");
    
    try {
      const req: ResetPasswordRequest = {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      }

      const response = await authClient.ResetPassword(req);
      
      console.log("Password reset successful:", response.message);
      
      // Redirect to login page with success message
      navigate("/login", { 
        state: { 
          message: response.message || "Password reset successfully. Please log in with your new password."
        }
      });
      
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Failed to reset password";
      setError(errorMessage);
      console.error("Failed to reset password:", err);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpSent) {
      handleSendCode();
    } else if (!otpVerified) {
      handleVerifyOtp();
    } else {
      handleResetPassword();
    }
  };

  const getSubmitButtonText = () => {
    if (resettingPassword) return "Resetting Password...";
    if (verifyingOtp) return "Verifying Code...";
    if (sendingOtp) return "Sending Code...";
    if (!otpSent) return "Send Verification Code";
    if (!otpVerified) return "Verify Code";
    return "Reset Password";
  };

  const isSubmitDisabled = () => {
    return sendingOtp || verifyingOtp || resettingPassword || 
           (!formData.email && !otpSent) ||
           (otpSent && !otpVerified && !formData.otp) ||
           (otpVerified && !formData.newPassword);
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
                {otpSent && !otpVerified && (
                  <p style={{ color: "#666", fontSize: "0.875rem" }}>
                    We've sent a verification code to {formData.email}
                  </p>
                )}
                {otpVerified && (
                  <p style={{ color: "#28a745", fontSize: "0.875rem" }}>
                    Code verified! Please enter your new password.
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div 
                  className="mb-3 p-3" 
                  style={{ 
                    background: "#f8d7da", 
                    color: "#721c24", 
                    border: "1px solid #f5c6cb",
                    borderRadius: "4px",
                    fontSize: "0.875rem"
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email/Phone Toggle - Only show if OTP not sent */}
                {!otpSent && (
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
                      disabled={otpSent}
                      className="w-100 p-3 mb-3"
                      style={{
                        border: "1px solid #ccc",
                        background: otpSent ? "#e9ecef" : "#f5f5f5",
                        opacity: otpSent ? 0.7 : 1
                      }}
                    />
                  </div>
                )}

                {/* Show email in read-only mode if OTP sent */}
                {otpSent && (
                  <div className="mb-3">
                    <label style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem", display: "block" }}>
                      {isPhoneReset ? "Phone number" : "Email address"}
                    </label>
                    <input
                      type={isPhoneReset ? "tel" : "email"}
                      value={formData.email}
                      disabled
                      className="w-100 p-3 mb-3"
                      style={{
                        border: "1px solid #ccc",
                        background: "#e9ecef",
                        opacity: 0.7
                      }}
                    />
                  </div>
                )}

                {/* Verification Code - Only show if OTP sent */}
                {otpSent && (
                  <div className="row mb-3">
                    <div className="col-8">
                      <input
                        type="text"
                        name="otp"
                        placeholder="Enter 6-digit code"
                        value={formData.otp}
                        onChange={handleChange}
                        disabled={otpVerified}
                        className="w-100 p-3"
                        style={{
                          border: "1px solid #ccc",
                          background: otpVerified ? "#e9ecef" : "#f5f5f5",
                          opacity: otpVerified ? 0.7 : 1
                        }}
                        maxLength={6}
                      />
                    </div>
                    <div className="col-4">
                      {!otpVerified ? (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={sendingOtp}
                          className="w-100 p-3"
                          style={{
                            border: "1px solid #ccc",
                            background: "#f5f5f5",
                            cursor: sendingOtp ? "not-allowed" : "pointer",
                            fontSize: "0.875rem"
                          }}
                        >
                          {sendingOtp ? "Sending..." : "Resend"}
                        </button>
                      ) : (
                        <div 
                          className="w-100 p-3 text-center"
                          style={{
                            border: "1px solid #28a745",
                            background: "#d4edda",
                            color: "#155724",
                            fontSize: "0.875rem"
                          }}
                        >
                          ✓ Verified
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* New Password - Only show if OTP verified */}
                {otpVerified && (
                  <div className="mb-4">
                    <div className="position-relative">
                      <input
                        type="password"
                        name="newPassword"
                        placeholder="Enter new password (min 8 characters)"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                        className="w-100 p-3"
                        style={{
                          border: "1px solid #ccc",
                          background: "#f5f5f5"
                        }}
                        minLength={8}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitDisabled()}
                  className="w-100 p-3 mb-4"
                  style={{
                    border: "1px solid #ccc",
                    background: isSubmitDisabled() ? "#e9ecef" : "#f5f5f5",
                    cursor: isSubmitDisabled() ? "not-allowed" : "pointer",
                    opacity: isSubmitDisabled() ? 0.7 : 1
                  }}
                >
                  {getSubmitButtonText()}
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