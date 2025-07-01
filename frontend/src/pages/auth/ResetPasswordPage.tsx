import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthServiceClientImpl, GrpcWebImpl, type ResetPasswordRequest } from "../../api/gen/auth"
import { BrowserHeaders } from "browser-headers"
import {
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Send,
  RotateCcw,
  Loader2,
} from "lucide-react"

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
})

const authClient = new AuthServiceClientImpl(transport)

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  })
  const [isPhoneReset, setIsPhoneReset] = useState(false)
  const [error, setError] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSendCode = async () => {
    if (!formData.email) {
      setError("Please enter your email address first")
      return
    }

    setSendingOtp(true)
    setError("")
    console.log("Send verification code to:", formData.email)

    try {
      const response = await authClient.SendOTP({
        email: formData.email,
      })

      setOtpSent(true)
      console.log("OTP sent successfully:", response.message)
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Failed to send verification code"
      setError(errorMessage)
      console.error("Failed to send verification code:", err)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setVerifyingOtp(true)
    setError("")

    try {
      const response = await authClient.VerifyOTP({
        email: formData.email,
        otp: formData.otp,
      })

      if (response.success) {
        setOtpVerified(true)
        console.log("OTP verified successfully:", response.message)
      } else {
        setError(response.message || "Invalid verification code")
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Failed to verify code"
      setError(errorMessage)
      console.error("Failed to verify OTP:", err)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResendCode = async () => {
    setFormData((prev) => ({ ...prev, otp: "" }))
    setOtpVerified(false)
    await handleSendCode()
  }

  const handleResetPassword = async () => {
    if (!formData.newPassword) {
      setError("Please enter a new password")
      return
    }
    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    if (!otpVerified) {
      setError("Please verify your code first")
      return
    }

    setResettingPassword(true)
    setError("")

    try {
      const req: ResetPasswordRequest = {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      }
      const response = await authClient.ResetPassword(req)

      console.log("Password reset successful:", response.message)

      // Redirect to login page with success message
      navigate("/login", {
        state: {
          message: response.message || "Password reset successfully. Please log in with your new password.",
        },
      })
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Failed to reset password"
      setError(errorMessage)
      console.error("Failed to reset password:", err)
    } finally {
      setResettingPassword(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpSent) {
      handleSendCode()
    } else if (!otpVerified) {
      handleVerifyOtp()
    } else {
      handleResetPassword()
    }
  }

  const getSubmitButtonText = () => {
    if (resettingPassword) return "Resetting Password..."
    if (verifyingOtp) return "Verifying Code..."
    if (sendingOtp) return "Sending Code..."
    if (!otpSent) return "Send Verification Code"
    if (!otpVerified) return "Verify Code"
    return "Reset Password"
  }

  const isSubmitDisabled = () => {
    return (
      sendingOtp ||
      verifyingOtp ||
      resettingPassword ||
      (!formData.email && !otpSent) ||
      (otpSent && !otpVerified && !formData.otp) ||
      (otpVerified && !formData.newPassword)
    )
  }

  const getCurrentStep = () => {
    if (!otpSent) return 1
    if (!otpVerified) return 2
    return 3
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          .slide-in {
            animation: slideIn 0.5s ease-out;
          }
          .input-focus:focus {
            outline: none;
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
          }
          .button-hover:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          }
          .button-hover:active:not(:disabled) {
            transform: translateY(0);
          }
          .button-hover {
            transition: all 0.2s ease;
          }
        `}
      </style>

      <div
        className="slide-in"
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
          position: "relative",
        }}
      >
        {/* Progress indicator */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background:
                    step <= getCurrentStep() ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "rgba(255, 255, 255, 0.1)",
                  color: step <= getCurrentStep() ? "white" : "rgba(255, 255, 255, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
              >
                {step === 1 && <Mail size={16} />}
                {step === 2 && <Shield size={16} />}
                {step === 3 && <Lock size={16} />}
              </div>
            ))}
          </div>
          <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "2px" }}>
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6, #1d4ed8)",
                borderRadius: "2px",
                width: `${(getCurrentStep() / 3) * 100}%`,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "white",
              marginBottom: "12px",
              background: "linear-gradient(135deg, #ffffff, #e5e7eb)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Reset Password
          </h1>
          {!otpSent && (
            <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "16px" }}>
              Enter your email to receive a verification code
            </p>
          )}
          {otpSent && !otpVerified && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Send size={16} style={{ color: "#10b981" }} />
              <p style={{ color: "#10b981", fontSize: "14px", margin: 0 }}>
                Verification code sent to {formData.email}
              </p>
            </div>
          )}
          {otpVerified && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <CheckCircle size={16} style={{ color: "#10b981" }} />
              <p style={{ color: "#10b981", fontSize: "14px", margin: 0 }}>Code verified! Enter your new password</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <AlertCircle size={20} style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ color: "#ef4444", fontSize: "14px" }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Email/Phone Input */}
          {!otpSent && (
            <div style={{ marginBottom: "24px" }}>
              {/* Toggle buttons */}
              <div style={{ display: "flex", marginBottom: "16px", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsPhoneReset(false)}
                  className="button-hover"
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: !isPhoneReset
                      ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Mail size={16} />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhoneReset(true)}
                  className="button-hover"
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: isPhoneReset
                      ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Phone size={16} />
                  Phone
                </button>
              </div>

              {/* Input field */}
              <div style={{ position: "relative" }}>
                <div
                  style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
                >
                  {isPhoneReset ? (
                    <Phone size={20} style={{ color: "rgba(255, 255, 255, 0.5)" }} />
                  ) : (
                    <Mail size={20} style={{ color: "rgba(255, 255, 255, 0.5)" }} />
                  )}
                </div>
                <input
                  type={isPhoneReset ? "tel" : "email"}
                  name="email"
                  placeholder={isPhoneReset ? "Enter phone number" : "Enter email address"}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-focus"
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 52px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "16px",
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Show email (read-only) and OTP input */}
          {otpSent && (
            <div style={{ marginBottom: "24px" }}>
              {/* Read-only email */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "14px",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  {isPhoneReset ? "Phone number" : "Email address"}
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
                  >
                    {isPhoneReset ? (
                      <Phone size={20} style={{ color: "rgba(255, 255, 255, 0.3)" }} />
                    ) : (
                      <Mail size={20} style={{ color: "rgba(255, 255, 255, 0.3)" }} />
                    )}
                  </div>
                  <input
                    type={isPhoneReset ? "tel" : "email"}
                    value={formData.email}
                    disabled
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 52px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>

              {/* OTP input and resend button */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <div
                    style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
                  >
                    <Shield size={20} style={{ color: otpVerified ? "#10b981" : "rgba(255, 255, 255, 0.5)" }} />
                  </div>
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit code"
                    value={formData.otp}
                    onChange={handleChange}
                    disabled={otpVerified}
                    maxLength={6}
                    className="input-focus"
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 52px",
                      background: otpVerified ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${otpVerified ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                      borderRadius: "12px",
                      color: otpVerified ? "#10b981" : "white",
                      fontSize: "16px",
                      letterSpacing: "2px",
                      textAlign: "center",
                      transition: "all 0.3s ease",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={sendingOtp || otpVerified}
                  className="button-hover"
                  style={{
                    padding: "16px",
                    background: otpVerified ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${otpVerified ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "12px",
                    color: otpVerified ? "#10b981" : "white",
                    cursor: sendingOtp || otpVerified ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "60px",
                    opacity: sendingOtp || otpVerified ? 0.5 : 1,
                  }}
                >
                  {otpVerified ? (
                    <CheckCircle size={20} />
                  ) : sendingOtp ? (
                    <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <RotateCcw size={20} />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {otpVerified && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
                >
                  <Lock size={20} style={{ color: "rgba(255, 255, 255, 0.5)" }} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Enter new password (min 8 characters)"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="input-focus"
                  style={{
                    width: "100%",
                    padding: "16px 52px 16px 52px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "16px",
                    transition: "all 0.3s ease",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.newPassword && formData.newPassword.length < 8 && (
                <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px", marginLeft: "4px" }}>
                  Password must be at least 8 characters long
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled()}
            className="button-hover"
            style={{
              width: "100%",
              padding: "16px",
              background: isSubmitDisabled()
                ? "rgba(255, 255, 255, 0.05)"
                : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isSubmitDisabled() ? "not-allowed" : "pointer",
              opacity: isSubmitDisabled() ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {(sendingOtp || verifyingOtp || resettingPassword) && (
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
            )}
            {getSubmitButtonText()}
          </button>
        </form>

        {/* Back to Login */}
        <div style={{ textAlign: "center" }}>
          <Link
            to="/login"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              textDecoration: "none",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)")}
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default ResetPasswordPage
