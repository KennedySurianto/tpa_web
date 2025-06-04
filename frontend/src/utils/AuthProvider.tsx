import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ValidateTokenRequest,
    RefreshTokenRequest,
    AuthResponse,
    UserInfo,
    LogoutRequest,
} from "../api/gen/auth";
import { authClient } from "../api/grpc/authClient";

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (response: AuthResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const login = (response: AuthResponse) => {
        localStorage.setItem("access_token", response.accessToken);
        localStorage.setItem("refresh_token", response.refreshToken);
        setUser(response.user || null);
    };

    const validateToken = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return false;

        const request: ValidateTokenRequest = { accessToken: token };

        try {
            const response = await authClient.ValidateToken(request);
            if (response.valid) {
                // If you want, reconstruct a minimal UserInfo object
                const userInfo: UserInfo = {
                    id: response.userId,
                    email: response.email,
                    username: response.username,
                    displayName: "",
                    bio: "",
                    avatarUrl: "",
                    isVerified: false,
                    isPrivate: false,
                    isActive: true,
                    country: "",
                    createdAt: undefined,
                    lastLoginAt: undefined,
                    preferences: undefined,
                    stats: undefined,
                };
                setUser(userInfo);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const refreshToken = async () => {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) return false;

        const request: RefreshTokenRequest = { refreshToken: refresh };

        try {
            const response: AuthResponse = await authClient.RefreshToken(request);

            if (response.success) {
                localStorage.setItem("access_token", response.accessToken);
                localStorage.setItem("refresh_token", response.refreshToken);
                setUser(response.user || null);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const logout = async () => {
        try {
            const req: LogoutRequest = {
                refreshToken: localStorage.getItem("refresh_token") || "",
                logoutAllDevices: true,
            };
            
            await authClient.Logout(req);

            // Clear tokens
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            // Clear user state and redirect
            setUser(null);
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Logout failed: " + error);
        }
    };

    useEffect(() => {
        const authenticate = async () => {
            const valid = await validateToken();
            if (!valid) {
                const refreshed = await refreshToken();
                if (!refreshed) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    setUser(null);
                }
            }
            setLoading(false);
        };

        authenticate();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
