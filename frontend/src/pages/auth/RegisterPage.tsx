// src/pages/RegisterPage.tsx

import React, { use, useState } from "react";
import { Link } from "react-router-dom";

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        month: "",
        day: "",
        year: "",
        username: "",
        email: "",
        password: "",
        verificationCode: "",
        acceptUpdates: false
    });

    const [isPhoneSignup, setIsPhoneSignup] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
        ...formData,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Register attempt:", formData);

        try {
            const response = await fetch("https://localhost:8080/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();
            console.log("Registration successful:", result);
            // Optionally redirect or show a success message
        } catch (error) {
            console.error("Registration failed:", error);
            // Optionally show error feedback to the user
        }
        };


    const handleSendCode = () => {
        console.log("Send verification code");
        // Implement send code logic here
    };

    // Generate arrays for dropdowns
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="d-flex align-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="container">
            <div className="row justify-center">
            <div className="col-12 col-sm-8 col-md-6 col-lg-5">
                <div className="p-4">
                {/* Header */}
                <div className="text-center mb-4">
                    <h1 className="mb-3">Sign up</h1>
                </div>

                <form onSubmit={handleSubmit}>
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
                            background: "#f5f5f5"
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
                            background: "#f5f5f5"
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
                            background: "#f5f5f5"
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

                    {/* Username */}
                    <div className="mb-3">
                    <div className="position-relative">
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
                            background: "#f5f5f5"
                        }}
                        />
                    </div>
                    </div>

                    {/* Email/Phone Toggle */}
                    <div className="mb-3">
                    <div className="d-flex mb-2">
                        <button
                        type="button"
                        onClick={() => setIsPhoneSignup(false)}
                        className="mr-3"
                        style={{
                            background: "none",
                            border: "none",
                            textDecoration: !isPhoneSignup ? "underline" : "none",
                            fontWeight: !isPhoneSignup ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                        >
                        Email
                        </button>
                        <button
                        type="button"
                        onClick={() => setIsPhoneSignup(true)}
                        style={{
                            background: "none",
                            border: "none",
                            textDecoration: isPhoneSignup ? "underline" : "none",
                            fontWeight: isPhoneSignup ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                        >
                        Sign up with phone
                        </button>
                    </div>

                    <input
                        type={isPhoneSignup ? "tel" : "email"}
                        name="email"
                        placeholder={isPhoneSignup ? "Phone number" : "Email address"}
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

                    {/* Password */}
                    <div className="mb-3">
                    <div className="position-relative">
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
                            background: "#f5f5f5"
                        }}
                        />
                    </div>
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

                    {/* Checkbox */}
                    <div className="mb-4">
                    <label className="d-flex align-start">
                        <input
                        type="checkbox"
                        name="acceptUpdates"
                        checked={formData.acceptUpdates}
                        onChange={handleChange}
                        className="mr-2 mt-1"
                        style={{ flexShrink: 0 }}
                        />
                        <span style={{ fontSize: "0.875rem", color: "#666" }}>
                        Get trending content, newsletters, promotions, recommendations, and account updates sent to your email
                        </span>
                    </label>
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
                    Next
                    </button>
                </form>

                {/* Back Link */}
                <div className="text-center">
                    <Link 
                    to="/"
                    style={{
                        color: "#000",
                        textDecoration: "none"
                    }}
                    >
                    ← Go back
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