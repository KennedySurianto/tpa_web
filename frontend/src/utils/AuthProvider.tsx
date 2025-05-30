import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ValidateTokenRequest,
    RefreshTokenRequest,
    AuthResponse,
    UserInfo,
    GrpcWebImpl,
    AuthServiceClientImpl,
} from "../api/gen/auth";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

const authClient = new AuthServiceClientImpl(transport);

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    loading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
                    username: "",
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

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        navigate("/login");
    };

    useEffect(() => {
        const authenticate = async () => {
            const valid = await validateToken();
            if (!valid) {
                const refreshed = await refreshToken();
                if (!refreshed) logout();
            }
            setLoading(false);
        };

        authenticate();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
