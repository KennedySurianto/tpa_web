// src/pages/RegisterPage.tsx

import React, { useState } from "react";
import { AuthServiceClientImpl, RegisterRequest, SendOTPRequest, UserPreferences } from "../../grpc/gen/auth";
import { Link } from "react-router-dom";
import { GrpcWebImpl } from "../../grpc/gen/auth";
import { BrowserHeaders } from "browser-headers";
import { useNavigate } from "react-router-dom";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

const authClient = new AuthServiceClientImpl(transport);

interface FormData {
    month: string;
    day: string;
    year: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    bio: string;
    country: string;
    verificationCode: string;
    acceptUpdates: boolean;
    isPrivate: boolean;
    // User Preferences
    allowDuet: boolean;
    allowStitch: boolean;
    allowDownload: boolean;
    allowComments: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    privacyLevel: string;
    commentFilter: string;
    showActivityStatus: boolean;
    allowMentions: boolean;
    allowDirectMessages: boolean;
}

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
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
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [isPhoneSignup, setIsPhoneSignup] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Check password match
        if (name === "password" || name === "confirmPassword") {
            const password = name === "password" ? value : formData.password;
            const confirmPassword = name === "confirmPassword" ? value : formData.confirmPassword;
            setPasswordMatch(password === confirmPassword || confirmPassword === "");
        }

        // Reset OTP verification if email changes
        if (name === "email") {
            setOtpSent(false);
            setOtpVerified(false);
            setFormData(prev => ({ ...prev, verificationCode: "" }));
        }
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(formData.month && formData.day && formData.year);
            case 2:
                return !!(formData.username && formData.email && formData.password && 
                        formData.confirmPassword && passwordMatch);
            case 3:
                return otpVerified;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            setError("");
        } else {
            if (currentStep === 3 && !otpVerified) {
                setError("Please verify your email address first.");
            } else {
                setError("Please fill in all required fields correctly.");
            }
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => prev - 1);
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        console.log("Register attempt:", formData);

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
            };

            const req: RegisterRequest = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                displayName: formData.displayName || formData.username,
                bio: formData.bio,
                avatarUrl: "",
                country: formData.country,
                isPrivate: formData.isPrivate,
                preferences: preferences,
            };

            const response = await authClient.Register(req);
            
            if (response.success) {
                console.log("Registration successful:", response.message);
                navigate("/login");
            } else {
                setError(response.error || response.message || "Registration failed");
                console.warn("Registration failed:", response.error || response.message);
            }
        } catch (err: any) {
            const errorMessage = err?.message || err?.toString() || "Network error occurred";
            setError(errorMessage);
            console.error("Registration failed:", err);
        } finally {
            setLoading(false);
        }
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
            const req: SendOTPRequest = {
                email: formData.email
            };
            
            const response = await authClient.SendOTP(req);
            
            setOtpSent(true);
            console.log(response.message);
        } catch (err: any) {
            const errorMessage = err?.message || err?.toString() || "Failed to send verification code";
            setError(errorMessage);
            console.error("Failed to send verification code:", err);
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!formData.verificationCode || formData.verificationCode.length !== 6) {
            setError("Please enter a valid 6-digit code");
            return;
        }

        setVerifyingOtp(true);
        setError("");
        
        try {
            const req = {
                email: formData.email,
                otp: formData.verificationCode
            };
            
            const response = await authClient.VerifyOTP(req);
            
            if (response.success) {
                setOtpVerified(true);
                console.log("OTP verified successfully");
            } else {
                setError("Invalid verification code");
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
        setFormData(prev => ({ ...prev, verificationCode: "" }));
        setOtpVerified(false);
        await handleSendCode();
    };

    // Generate arrays for dropdowns
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    const countries = [
        "United States", "Canada", "United Kingdom", "Germany", "France", 
        "Japan", "Australia", "Brazil", "India", "China", "Other"
    ];

    const renderStep1 = () => (
        <>
            <div className="text-center mb-4">
                <h1 className="mb-3">Create your account</h1>
                <p style={{ color: "#666" }}>Step 1 of 4: Basic Information</p>
            </div>

            {/* Birthday Section */}
            <div className="mb-4">
                <label className="mb-2 d-block">When's your birthday?</label>
                <div className="row mb-2">
                    <div className="col-4">
                        <select
                            name="month"
                            value={formData.month}
                            onChange={handleChange}
                            className="w-100 p-2"
                            style={{
                                border: "1px solid #ccc",
                                background: "#f5f5f5",
                                borderRadius: "4px"
                            }}
                            required
                        >
                            <option value="">Month</option>
                            {months.map((month, index) => (
                                <option key={index} value={index + 1}>
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-4">
                        <select
                            name="day"
                            value={formData.day}
                            onChange={handleChange}
                            className="w-100 p-2"
                            style={{
                                border: "1px solid #ccc",
                                background: "#f5f5f5",
                                borderRadius: "4px"
                            }}
                            required
                        >
                            <option value="">Day</option>
                            {days.map(day => (
                                <option key={day} value={day}>
                                    {day}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-4">
                        <select
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className="w-100 p-2"
                            style={{
                                border: "1px solid #ccc",
                                background: "#f5f5f5",
                                borderRadius: "4px"
                            }}
                            required
                        >
                            <option value="">Year</option>
                            {years.map(year => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <p style={{ color: "#666", fontSize: "0.875rem" }}>
                    Your birthday won't be shown publicly.
                </p>
            </div>

            <button
                type="button"
                onClick={handleNext}
                className="btn btn-black w-100 mb-3"
                disabled={!validateStep(1)}
            >
                Next
            </button>
        </>
    );

    const renderStep2 = () => (
        <>
            <div className="text-center mb-4">
                <h1 className="mb-3">Account Details</h1>
                <p style={{ color: "#666" }}>Step 2 of 4: Login Information</p>
            </div>

            {/* Username */}
            <div className="mb-3">
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-100 p-3"
                    style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                />
            </div>

            {/* Display Name */}
            <div className="mb-3">
                <input
                    type="text"
                    name="displayName"
                    placeholder="Display Name (optional)"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="w-100 p-3"
                    style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                />
            </div>

            {/* Email/Phone Toggle */}
            <div className="mb-3">
                <div className="d-flex mb-2">
                    <button
                        type="button"
                        onClick={() => setIsPhoneSignup(false)}
                        className="mr-3 btn-link"
                        style={{
                            textDecoration: !isPhoneSignup ? "underline" : "none",
                            fontWeight: !isPhoneSignup ? "bold" : "normal"
                        }}
                    >
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsPhoneSignup(true)}
                        className="btn-link"
                        style={{
                            textDecoration: isPhoneSignup ? "underline" : "none",
                            fontWeight: isPhoneSignup ? "bold" : "normal"
                        }}
                    >
                        Phone
                    </button>
                </div>

                <input
                    type={isPhoneSignup ? "tel" : "email"}
                    name="email"
                    placeholder={isPhoneSignup ? "Phone number" : "Email address"}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-100 p-3"
                    style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                />
            </div>

            {/* Password */}
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
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                />
            </div>

            {/* Confirm Password */}
            <div className="mb-3">
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-100 p-3"
                    style={{
                        border: `1px solid ${!passwordMatch ? "#f00" : "#ccc"}`,
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                />
                {!passwordMatch && (
                    <p style={{ color: "#f00", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                        Passwords do not match
                    </p>
                )}
            </div>

            <div className="d-flex justify-between">
                <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn btn-white"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-black"
                    disabled={!validateStep(2)}
                >
                    Next
                </button>
            </div>
        </>
    );

    const renderStep3 = () => (
        <>
            <div className="text-center mb-4">
                <h1 className="mb-3">Verify your account</h1>
                <p style={{ color: "#666" }}>Step 3 of 4: Enter verification code</p>
                {otpSent && !otpVerified && (
                    <p style={{ color: "#28a745", fontSize: "0.875rem" }}>
                        Verification code sent to {formData.email}
                    </p>
                )}
                {otpVerified && (
                    <p style={{ color: "#28a745", fontSize: "0.875rem" }}>
                        ✓ Email verified successfully
                    </p>
                )}
            </div>

            {/* Verification Code */}
            <div className="mb-3">
                <input
                    type="text"
                    name="verificationCode"
                    placeholder="Enter 6-digit code"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    className="w-100 p-3 mb-3"
                    style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                    maxLength={6}
                    disabled={otpVerified}
                />

                {!otpSent ? (
                    <button
                        type="button"
                        onClick={handleSendCode}
                        className="btn btn-black w-100"
                        disabled={sendingOtp || !formData.email}
                    >
                        {sendingOtp ? "Sending..." : "Send Code"}
                    </button>
                ) : !otpVerified ? (
                    <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="btn btn-black w-100"
                        disabled={verifyingOtp || !formData.verificationCode || formData.verificationCode.length !== 6}
                    >
                        {verifyingOtp ? "Verifying..." : "Verify Code"}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn btn-success w-100"
                        disabled
                    >
                        ✓ Verified
                    </button>
                )}
            </div>

            {otpSent && !otpVerified && (
                <div className="text-center mb-3">
                    <button
                        type="button"
                        onClick={handleResendCode}
                        className="btn-link"
                        style={{ color: "#666", fontSize: "0.875rem" }}
                        disabled={sendingOtp}
                    >
                        {sendingOtp ? "Sending..." : "Didn't receive the code? Resend"}
                    </button>
                </div>
            )}

            <div className="d-flex justify-between">
                <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn btn-white"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-black"
                    disabled={!validateStep(3)}
                >
                    Next
                </button>
            </div>
        </>
    );

    const renderStep4 = () => (
        <>
            <div className="text-center mb-4">
                <h1 className="mb-3">Final Details</h1>
                <p style={{ color: "#666" }}>Step 4 of 4: Profile & Preferences</p>
            </div>

            {/* Bio */}
            <div className="mb-3">
                <textarea
                    name="bio"
                    placeholder="Tell us about yourself (optional)"
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-100 p-3"
                    style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px",
                        minHeight: "80px",
                        resize: "vertical"
                    }}
                    maxLength={160}
                />
            </div>

            {/* Country */}
            <div className="mb-3">
                <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-100 p-3"
                    style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                >
                    <option value="">Select Country (optional)</option>
                    {countries.map(country => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>
            </div>

            {/* Privacy Settings */}
            <div className="mb-3">
                <label className="d-flex align-start mb-2">
                    <input
                        type="checkbox"
                        name="isPrivate"
                        checked={formData.isPrivate}
                        onChange={handleChange}
                        className="mr-2 mt-1"
                        style={{ flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>
                        Make my account private
                    </span>
                </label>
            </div>

            {/* Privacy Level */}
            <div className="mb-3">
                <label className="mb-2 d-block" style={{ fontSize: "0.875rem", fontWeight: "bold" }}>
                    Who can see your content?
                </label>
                <select
                    name="privacyLevel"
                    value={formData.privacyLevel}
                    onChange={handleChange}
                    className="w-100 p-2"
                    style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                >
                    <option value="public">Everyone</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Only me</option>
                </select>
            </div>

            {/* Comment Filter */}
            <div className="mb-3">
                <label className="mb-2 d-block" style={{ fontSize: "0.875rem", fontWeight: "bold" }}>
                    Who can comment on your posts?
                </label>
                <select
                    name="commentFilter"
                    value={formData.commentFilter}
                    onChange={handleChange}
                    className="w-100 p-2"
                    style={{
                        border: "1px solid #ccc",
                        background: "#f5f5f5",
                        borderRadius: "4px"
                    }}
                >
                    <option value="all">Everyone</option>
                    <option value="friends">Friends only</option>
                    <option value="none">No one</option>
                </select>
            </div>

            {/* Feature Preferences */}
            <div className="mb-3">
                <p style={{ fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                    Allow others to:
                </p>
                <label className="d-flex align-start mb-2">
                    <input
                        type="checkbox"
                        name="allowDuet"
                        checked={formData.allowDuet}
                        onChange={handleChange}
                        className="mr-2 mt-1"
                        style={{ flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>Duet with your videos</span>
                </label>
                <label className="d-flex align-start mb-2">
                    <input
                        type="checkbox"
                        name="allowStitch"
                        checked={formData.allowStitch}
                        onChange={handleChange}
                        className="mr-2 mt-1"
                        style={{ flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>Stitch your videos</span>
                </label>
                <label className="d-flex align-start mb-2">
                    <input
                        type="checkbox"
                        name="allowDownload"
                        checked={formData.allowDownload}
                        onChange={handleChange}
                        className="mr-2 mt-1"
                        style={{ flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>Download your videos</span>
                </label>
            </div>

            {/* Notification Preferences */}
            <div className="mb-4">
                <p style={{ fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                    Notifications:
                </p>
                <label className="d-flex align-start mb-2">
                    <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleChange}
                        className="mr-2 mt-1"
                        style={{ flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>Email notifications</span>
                </label>
                <label className="d-flex align-start mb-2">
                    <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={formData.pushNotifications}
                        onChange={handleChange}
                        className="mr-2 mt-1"
                        style={{ flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>Push notifications</span>
                </label>
                <label className="d-flex align-start mb-4">
                    <input
                        type="checkbox"
                        name="acceptUpdates"
                        checked={formData.acceptUpdates}
                        onChange={handleChange}
                        className="mr-2 mt-1"
                        style={{ flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>
                        Get trending content, newsletters, promotions, and recommendations
                    </span>
                </label>
            </div>

            <div className="d-flex justify-between">
                <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn btn-white"
                >
                    Previous
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-black"
                    style={{
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    {loading ? "Creating Account..." : "Create Account"}
                </button>
            </div>
        </>
    );

    return (
        <div className="d-flex align-center justify-center" style={{ minHeight: "100vh", background: "#fafafa" }}>
            <div className="container">
                <div className="row justify-center">
                    <div className="col-12 col-sm-8 col-md-6 col-lg-5">
                        <div className="p-4" style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                            {/* Progress Indicator */}
                            <div className="mb-4">
                                <div className="d-flex justify-between mb-2">
                                    {[1, 2, 3, 4].map(step => (
                                        <div
                                            key={step}
                                            style={{
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                background: step <= currentStep ? "#000" : "#ddd",
                                                color: step <= currentStep ? "white" : "#666",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "0.75rem",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {step}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ height: "4px", background: "#eee", borderRadius: "2px" }}>
                                    <div 
                                        style={{ 
                                            height: "100%", 
                                            background: "#000", 
                                            borderRadius: "2px",
                                            width: `${(currentStep / 4) * 100}%`,
                                            transition: "width 0.3s ease"
                                        }} 
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div 
                                    className="mb-3 p-3"
                                    style={{
                                        backgroundColor: "#fee",
                                        border: "1px solid #fcc",
                                        borderRadius: "4px",
                                        color: "#c00"
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {currentStep === 1 && renderStep1()}
                                {currentStep === 2 && renderStep2()}
                                {currentStep === 3 && renderStep3()}
                                {currentStep === 4 && renderStep4()}
                            </form>

                            {/* Back Link */}
                            <div className="text-center mt-4">
                                <Link 
                                    to="/"
                                    className="btn-link"
                                    style={{ color: "#666" }}
                                >
                                    ← Back to home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;