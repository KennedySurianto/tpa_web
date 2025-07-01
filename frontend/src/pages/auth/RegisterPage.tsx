import type React from "react"
import { useState } from "react"
import {
  AuthServiceClientImpl,
  type RegisterRequest,
  type SendOTPRequest,
  type UserPreferences,
} from "../../api/gen/auth"
import { Link } from "react-router-dom"
import { GrpcWebImpl } from "../../api/gen/auth"
import { BrowserHeaders } from "browser-headers"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Send,
  Shield,
  Settings,
  Globe,
  Users,
  MessageCircle,
  Bell,
  Sparkles,
  Phone,
  FileText,
  MapPin,
  Check,
} from "lucide-react"

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
})

const authClient = new AuthServiceClientImpl(transport)

interface FormData {
  month: string
  day: string
  year: string
  username: string
  email: string
  password: string
  confirmPassword: string
  displayName: string
  bio: string
  country: string
  verificationCode: string
  acceptUpdates: boolean
  isPrivate: boolean
  // User Preferences
  allowDuet: boolean
  allowStitch: boolean
  allowDownload: boolean
  allowComments: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  privacyLevel: string
  commentFilter: string
  showActivityStatus: boolean
  allowMentions: boolean
  allowDirectMessages: boolean
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    month: "",
    day: "",
    year: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    bio: "",
    country: "",
    verificationCode: "",
    acceptUpdates: false,
    isPrivate: false,
    // Default preferences
    allowDuet: true,
    allowStitch: true,
    allowDownload: true,
    allowComments: true,
    emailNotifications: true,
    pushNotifications: true,
    privacyLevel: "public",
    commentFilter: "all",
    showActivityStatus: true,
    allowMentions: true,
    allowDirectMessages: true,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [isPhoneSignup, setIsPhoneSignup] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  const validateField = (name: string, value: string) => {
    const errors: { [key: string]: string } = {}

    if (name === "username") {
      if (!value) {
        errors.username = "Username is required"
      } else if (value.length < 3) {
        errors.username = "Username must be at least 3 characters"
      } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        errors.username = "Username can only contain letters, numbers, and underscores"
      }
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!value) {
        errors.email = "Email is required"
      } else if (!emailRegex.test(value)) {
        errors.email = "Please enter a valid email address"
      }
    }

    if (name === "password") {
      if (!value) {
        errors.password = "Password is required"
      } else if (value.length < 8) {
        errors.password = "Password must be at least 8 characters"
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        errors.password = "Password must contain uppercase, lowercase, and number"
      }
    }

    return errors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    // Clear field-specific errors
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    }

    // Check password match
    if (name === "password" || name === "confirmPassword") {
      const password = name === "password" ? value : formData.password
      const confirmPassword = name === "confirmPassword" ? value : formData.confirmPassword
      setPasswordMatch(password === confirmPassword || confirmPassword === "")
    }

    // Reset OTP verification if email changes
    if (name === "email") {
      setOtpSent(false)
      setOtpVerified(false)
      setFormData((prev) => ({ ...prev, verificationCode: "" }))
    }

    // Real-time validation
    const errors = validateField(name, value)
    setFieldErrors((prev) => ({ ...prev, ...errors }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.month && formData.day && formData.year)
      case 2:
        return !!(
          formData.username &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          passwordMatch &&
          !Object.keys(fieldErrors).some((key) => fieldErrors[key])
        )
      case 3:
        return otpVerified
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
      setError("")
    } else {
      if (currentStep === 3 && !otpVerified) {
        setError("Please verify your email address first.")
      } else {
        setError("Please fill in all required fields correctly.")
      }
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("Register attempt:", formData)
    try {
      const preferences: UserPreferences = {
        allowDuet: formData.allowDuet,
        allowStitch: formData.allowStitch,
        allowDownload: formData.allowDownload,
        allowComments: formData.allowComments,
        emailNotifications: formData.emailNotifications,
        pushNotifications: formData.pushNotifications,
        privacyLevel: formData.privacyLevel,
        commentFilter: formData.commentFilter,
        showActivityStatus: formData.showActivityStatus,
        allowMentions: formData.allowMentions,
        allowDirectMessages: formData.allowDirectMessages,
      }

      const req: RegisterRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        displayName: formData.displayName || formData.username,
        bio: formData.bio,
        avatar: new Uint8Array(),
        country: formData.country,
        isPrivate: formData.isPrivate,
        preferences: preferences,
      }

      const response = await authClient.Register(req)

      if (response.success) {
        console.log("Registration successful:", response.message)
        navigate("/login")
      } else {
        setError(response.error || response.message || "Registration failed")
        console.warn("Registration failed:", response.error || response.message)
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Network error occurred"
      setError(errorMessage)
      console.error("Registration failed:", err)
    } finally {
      setLoading(false)
    }
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
      const req: SendOTPRequest = {
        email: formData.email,
      }

      const response = await authClient.SendOTP(req)

      setOtpSent(true)
      console.log(response.message)
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Failed to send verification code"
      setError(errorMessage)
      console.error("Failed to send verification code:", err)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setVerifyingOtp(true)
    setError("")

    try {
      const req = {
        email: formData.email,
        otp: formData.verificationCode,
      }

      const response = await authClient.VerifyOTP(req)

      if (response.success) {
        setOtpVerified(true)
        console.log("OTP verified successfully")
      } else {
        setError("Invalid verification code")
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
    setFormData((prev) => ({ ...prev, verificationCode: "" }))
    setOtpVerified(false)
    await handleSendCode()
  }

  // Generate arrays for dropdowns
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Japan",
    "Australia",
    "Brazil",
    "India",
    "China",
    "Other",
  ]

  const renderStep1 = () => (
    <div className="step-content">
      <div className="step-header">
        <div className="step-icon">
          <Calendar size={24} />
        </div>
        <h2 className="step-title">When's your birthday?</h2>
        <p className="step-subtitle">Your birthday won't be shown publicly</p>
      </div>

      <div className="birthday-section">
        <div className="birthday-grid">
          <div className="form-group">
            <label className="form-label">Month</label>
            <div className="select-container">
              <select name="month" value={formData.month} onChange={handleChange} className="form-select" required>
                <option value="">Month</option>
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Day</label>
            <div className="select-container">
              <select name="day" value={formData.day} onChange={handleChange} className="form-select" required>
                <option value="">Day</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Year</label>
            <div className="select-container">
              <select name="year" value={formData.year} onChange={handleChange} className="form-select" required>
                <option value="">Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button type="button" onClick={handleNext} className="btn-primary full-width" disabled={!validateStep(1)}>
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="step-content">
      <div className="step-header">
        <div className="step-icon">
          <User size={24} />
        </div>
        <h2 className="step-title">Create your account</h2>
        <p className="step-subtitle">Choose your username and secure your account</p>
      </div>

      <div className="form-section">
        {/* Username */}
        <div className="form-group">
          <label className="form-label">Username</label>
          <div
            className={`input-container ${fieldErrors.username ? "error" : ""} ${formData.username ? "filled" : ""}`}
          >
            <User size={18} className="input-icon" />
            <input
              type="text"
              name="username"
              placeholder="Choose a unique username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              required
            />
            {formData.username && !fieldErrors.username && <CheckCircle size={16} className="success-icon" />}
          </div>
          {fieldErrors.username && (
            <div className="field-error">
              <AlertCircle size={12} />
              <span>{fieldErrors.username}</span>
            </div>
          )}
        </div>

        {/* Display Name */}
        <div className="form-group">
          <label className="form-label">Display Name (Optional)</label>
          <div className={`input-container ${formData.displayName ? "filled" : ""}`}>
            <FileText size={18} className="input-icon" />
            <input
              type="text"
              name="displayName"
              placeholder="How others will see your name"
              value={formData.displayName}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>

        {/* Email/Phone Toggle */}
        <div className="form-group">
          <div className="toggle-section">
            <div className="toggle-buttons">
              <button
                type="button"
                onClick={() => setIsPhoneSignup(false)}
                className={`toggle-button ${!isPhoneSignup ? "active" : ""}`}
              >
                <Mail size={16} />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPhoneSignup(true)}
                className={`toggle-button ${isPhoneSignup ? "active" : ""}`}
              >
                <Phone size={16} />
                <span>Phone</span>
              </button>
            </div>
          </div>

          <div className={`input-container ${fieldErrors.email ? "error" : ""} ${formData.email ? "filled" : ""}`}>
            {isPhoneSignup ? <Phone size={18} className="input-icon" /> : <Mail size={18} className="input-icon" />}
            <input
              type={isPhoneSignup ? "tel" : "email"}
              name="email"
              placeholder={isPhoneSignup ? "Phone number" : "Email address"}
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
            {formData.email && !fieldErrors.email && <CheckCircle size={16} className="success-icon" />}
          </div>
          {fieldErrors.email && (
            <div className="field-error">
              <AlertCircle size={12} />
              <span>{fieldErrors.email}</span>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <div
            className={`input-container ${fieldErrors.password ? "error" : ""} ${formData.password ? "filled" : ""}`}
          >
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
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

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div
            className={`input-container ${!passwordMatch ? "error" : ""} ${formData.confirmPassword ? "filled" : ""}`}
          >
            <Lock size={18} className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {!passwordMatch && formData.confirmPassword && (
            <div className="field-error">
              <AlertCircle size={12} />
              <span>Passwords do not match</span>
            </div>
          )}
        </div>
      </div>

      <div className="step-actions">
        <button type="button" onClick={handlePrevious} className="btn-secondary">
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>
        <button type="button" onClick={handleNext} className="btn-primary" disabled={!validateStep(2)}>
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="step-content">
      <div className="step-header">
        <div className="step-icon">
          <Shield size={24} />
        </div>
        <h2 className="step-title">Verify your account</h2>
        <p className="step-subtitle">
          {otpSent && !otpVerified && `Verification code sent to ${formData.email}`}
          {otpVerified && "Email verified successfully!"}
          {!otpSent && "We'll send you a verification code"}
        </p>
      </div>

      <div className="verification-section">
        {otpVerified && (
          <div className="success-banner">
            <CheckCircle size={20} />
            <span>Email verified successfully</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Verification Code</label>
          <div className={`input-container ${formData.verificationCode ? "filled" : ""}`}>
            <Send size={18} className="input-icon" />
            <input
              type="text"
              name="verificationCode"
              placeholder="Enter 6-digit code"
              value={formData.verificationCode}
              onChange={handleChange}
              className="form-input verification-input"
              maxLength={6}
              disabled={otpVerified}
            />
            {otpVerified && <CheckCircle size={16} className="success-icon" />}
          </div>
        </div>

        <div className="verification-actions">
          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendCode}
              className="btn-primary full-width"
              disabled={sendingOtp || !formData.email}
            >
              {sendingOtp ? (
                <>
                  <Loader2 size={16} className="loading-spinner" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Verification Code</span>
                </>
              )}
            </button>
          ) : !otpVerified ? (
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="btn-primary full-width"
              disabled={verifyingOtp || !formData.verificationCode || formData.verificationCode.length !== 6}
            >
              {verifyingOtp ? (
                <>
                  <Loader2 size={16} className="loading-spinner" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>Verify Code</span>
                </>
              )}
            </button>
          ) : (
            <button type="button" className="btn-success full-width" disabled>
              <CheckCircle size={16} />
              <span>Verified</span>
            </button>
          )}
        </div>

        {otpSent && !otpVerified && (
          <div className="resend-section">
            <button type="button" onClick={handleResendCode} className="resend-button" disabled={sendingOtp}>
              {sendingOtp ? "Sending..." : "Didn't receive the code? Resend"}
            </button>
          </div>
        )}
      </div>

      <div className="step-actions">
        <button type="button" onClick={handlePrevious} className="btn-secondary">
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>
        <button type="button" onClick={handleNext} className="btn-primary" disabled={!validateStep(3)}>
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="step-content">
      <div className="step-header">
        <div className="step-icon">
          <Settings size={24} />
        </div>
        <h2 className="step-title">Customize your experience</h2>
        <p className="step-subtitle">Set up your profile and privacy preferences</p>
      </div>

      <div className="form-section">
        {/* Bio */}
        <div className="form-group">
          <label className="form-label">Bio (Optional)</label>
          <div className={`textarea-container ${formData.bio ? "filled" : ""}`}>
            <FileText size={18} className="textarea-icon" />
            <textarea
              name="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={handleChange}
              className="form-textarea"
              maxLength={160}
              rows={3}
            />
          </div>
          <div className="character-count">{formData.bio.length}/160</div>
        </div>

        {/* Country */}
        <div className="form-group">
          <label className="form-label">Country (Optional)</label>
          <div className="select-container">
            <MapPin size={18} className="select-icon" />
            <select name="country" value={formData.country} onChange={handleChange} className="form-select">
              <option value="">Select your country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="settings-section">
          <h3 className="section-title">
            <Shield size={18} />
            Privacy Settings
          </h3>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-custom">{formData.isPrivate && <Check size={12} />}</div>
              <div className="setting-content">
                <span className="setting-title">Private Account</span>
                <span className="setting-description">Only approved followers can see your content</span>
              </div>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Who can see your content?</label>
            <div className="select-container">
              <Globe size={18} className="select-icon" />
              <select name="privacyLevel" value={formData.privacyLevel} onChange={handleChange} className="form-select">
                <option value="public">Everyone</option>
                <option value="friends">Friends only</option>
                <option value="private">Only me</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Who can comment on your posts?</label>
            <div className="select-container">
              <MessageCircle size={18} className="select-icon" />
              <select
                name="commentFilter"
                value={formData.commentFilter}
                onChange={handleChange}
                className="form-select"
              >
                <option value="all">Everyone</option>
                <option value="friends">Friends only</option>
                <option value="none">No one</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feature Preferences */}
        <div className="settings-section">
          <h3 className="section-title">
            <Users size={18} />
            Content Permissions
          </h3>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="allowDuet"
                checked={formData.allowDuet}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-custom">{formData.allowDuet && <Check size={12} />}</div>
              <div className="setting-content">
                <span className="setting-title">Allow Duets</span>
                <span className="setting-description">Let others create duets with your videos</span>
              </div>
            </label>
          </div>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="allowStitch"
                checked={formData.allowStitch}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-custom">{formData.allowStitch && <Check size={12} />}</div>
              <div className="setting-content">
                <span className="setting-title">Allow Stitches</span>
                <span className="setting-description">Let others stitch parts of your videos</span>
              </div>
            </label>
          </div>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="allowDownload"
                checked={formData.allowDownload}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-custom">{formData.allowDownload && <Check size={12} />}</div>
              <div className="setting-content">
                <span className="setting-title">Allow Downloads</span>
                <span className="setting-description">Let others download your videos</span>
              </div>
            </label>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-section">
          <h3 className="section-title">
            <Bell size={18} />
            Notifications
          </h3>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-custom">{formData.emailNotifications && <Check size={12} />}</div>
              <div className="setting-content">
                <span className="setting-title">Email Notifications</span>
                <span className="setting-description">Receive updates via email</span>
              </div>
            </label>
          </div>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="pushNotifications"
                checked={formData.pushNotifications}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-custom">{formData.pushNotifications && <Check size={12} />}</div>
              <div className="setting-content">
                <span className="setting-title">Push Notifications</span>
                <span className="setting-description">Receive notifications on your device</span>
              </div>
            </label>
          </div>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="acceptUpdates"
                checked={formData.acceptUpdates}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-custom">{formData.acceptUpdates && <Check size={12} />}</div>
              <div className="setting-content">
                <span className="setting-title">Marketing Updates</span>
                <span className="setting-description">Get trending content and recommendations</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button type="button" onClick={handlePrevious} className="btn-secondary">
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <Loader2 size={16} className="loading-spinner" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Create Account</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="register-container">
      {/* Background Elements */}
      <div className="background-gradient"></div>
      <div className="background-pattern"></div>

      <div className="content-wrapper">
        <div className="register-card">
          {/* Progress Indicator */}
          <div className="progress-section">
            <div className="progress-steps">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`progress-step ${step <= currentStep ? "active" : ""}`}>
                  <div className="step-number">{step}</div>
                  <div className="step-label">
                    {step === 1 && "Birthday"}
                    {step === 2 && "Account"}
                    {step === 3 && "Verify"}
                    {step === 4 && "Preferences"}
                  </div>
                </div>
              ))}
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="register-form">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </form>

          {/* Footer */}
          <div className="footer-section">
            <div className="login-link">
              <span>Already have an account? </span>
              <Link to="/login" className="link">
                Sign in
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
        .register-container {
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
          max-width: 600px;
          position: relative;
          z-index: 1;
        }

        .register-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 2rem;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideInUp 0.8s ease-out;
          position: relative;
          overflow: hidden;
        }

        .register-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        }

        .progress-section {
          margin-bottom: 2.5rem;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .progress-step.active .step-number {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-color: #3b82f6;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .step-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          text-align: center;
        }

        .progress-step.active .step-label {
          color: #ffffff;
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: 2px;
          transition: width 0.5s ease;
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

        .register-form {
          margin-bottom: 2rem;
        }

        .step-content {
          animation: fadeInSlide 0.5s ease-out;
        }

        .step-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .step-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          margin: 0 auto 1rem;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }

        .step-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff, #e5e7eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .step-subtitle {
          margin: 0;
          color: #9ca3af;
          font-size: 0.95rem;
          font-weight: 400;
        }

        .form-section {
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

        .field-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fca5a5;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          padding-left: 0.25rem;
        }

        .select-container {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.875rem;
          transition: all 0.3s ease;
        }

        .select-container:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .select-icon {
          position: absolute;
          left: 1rem;
          color: #9ca3af;
          pointer-events: none;
          z-index: 1;
        }

        .form-select {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
          cursor: pointer;
        }

        .form-select option {
          background: #1a1a1a;
          color: #ffffff;
        }

        .textarea-container {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.875rem;
          transition: all 0.3s ease;
        }

        .textarea-container:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .textarea-container.filled {
          background: rgba(255, 255, 255, 0.08);
        }

        .textarea-icon {
          position: absolute;
          top: 1rem;
          left: 1rem;
          color: #9ca3af;
          pointer-events: none;
          z-index: 1;
        }

        .form-textarea {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
        }

        .form-textarea::placeholder {
          color: #6b7280;
        }

        .character-count {
          text-align: right;
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .birthday-section {
          margin-bottom: 2rem;
        }

        .birthday-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 1rem;
        }

        .toggle-section {
          margin-bottom: 1rem;
        }

        .toggle-buttons {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          padding: 0.25rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .toggle-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 0.5rem;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-button.active {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .verification-section {
          margin-bottom: 2rem;
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 0.875rem;
          color: #6ee7b7;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        .verification-input {
          text-align: center;
          font-size: 1.125rem;
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .verification-actions {
          margin-bottom: 1rem;
        }

        .resend-section {
          text-align: center;
        }

        .resend-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: underline;
        }

        .resend-button:hover {
          color: #9ca3af;
        }

        .resend-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .settings-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }

        .setting-item {
          margin-bottom: 1rem;
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0.75rem;
          border-radius: 0.75rem;
        }

        .checkbox-label:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #6b7280;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: transparent;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #ffffff;
        }

        .setting-content {
          flex: 1;
          min-width: 0;
        }

        .setting-title {
          display: block;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .setting-description {
          display: block;
          color: #9ca3af;
          font-size: 0.8rem;
          line-height: 1.3;
        }

        .step-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-primary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.125rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 0.875rem;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.125rem 1.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.875rem;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .btn-success {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.125rem 1.5rem;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 0.875rem;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          cursor: not-allowed;
          opacity: 0.9;
        }

        .full-width {
          width: 100%;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        .footer-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .login-link {
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

        @keyframes fadeInSlide {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
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
          .register-container {
            padding: 1.5rem 1rem;
          }

          .register-card {
            padding: 2rem 1.5rem;
            border-radius: 1.5rem;
          }

          .step-title {
            font-size: 1.5rem;
          }

          .birthday-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .step-actions {
            flex-direction: column;
          }

          .btn-secondary {
            order: 2;
          }

          .btn-primary {
            order: 1;
          }

          .settings-section {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .register-container {
            padding: 1rem 0.75rem;
          }

          .register-card {
            padding: 1.5rem 1rem;
          }

          .step-icon {
            width: 50px;
            height: 50px;
          }

          .step-title {
            font-size: 1.25rem;
          }

          .progress-steps {
            gap: 0.5rem;
          }

          .step-number {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }

          .step-label {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  )
}

export default RegisterPage
