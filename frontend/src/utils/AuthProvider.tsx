import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { grpc } from "@improbable-eng/grpc-web";
import {
  AuthResponse,
  LogoutRequest,
  RefreshTokenRequest,
  ValidateTokenRequest,
} from "../api/gen/auth"; // Assuming these are from your gRPC generation
import { authClient } from "../api/grpc/authClient";

// Define or import your detailed User interface
interface User {
  id: string;
  username: string;
  email: string;
}

// Update AuthContextType to use the new User interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
  getAuthMetadata(): grpc.Metadata;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the detailed User interface for the state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // This function now expects `response.user` to be a complete User object
  const login = (response: AuthResponse) => {
    localStorage.setItem("access_token", response.accessToken);
    localStorage.setItem("refresh_token", response.refreshToken);
    // The user object from the response should match the detailed User interface
    // Note: The 'user' property on AuthResponse should also be updated to the new User type
    setUser(response.user || null);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("refresh_token");

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);

    if (refreshToken) {
      const req: LogoutRequest = { refreshToken, logoutAllDevices: false };
      authClient.Logout(req).catch((err) => {
        console.error("Background server-side logout failed:", err);
      });
    }
    navigate("/login");
  };

  const validateToken = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return false;

    const request: ValidateTokenRequest = { accessToken: token };

    try {
      const response = await authClient.ValidateToken(request);
      // Ensure the user object in the validation response is also the full User object
      if (response.valid) {
        const resUser: User = {
          id: response.userId,
          username: response.username,
          email: response.email
        }
        setUser(resUser);
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

      if (response.success && response.user) {
        localStorage.setItem("access_token", response.accessToken);
        localStorage.setItem("refresh_token", response.refreshToken);
        setUser(response.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const authenticate = async () => {
      setLoading(true);
      const isValid = await validateToken();
      if (!isValid) {
        const isRefreshed = await refreshToken();
        if (!isRefreshed) {
          logout();
        }
      }
      setLoading(false);
    };

    authenticate();
  }, []);

  const getAuthMetadata = (): grpc.Metadata => {
    const token = localStorage.getItem("access_token");
    const metadata = new grpc.Metadata();
    if (token) {
      metadata.set("authorization", `Bearer ${token}`);
    }
    return metadata;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        getAuthMetadata,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};