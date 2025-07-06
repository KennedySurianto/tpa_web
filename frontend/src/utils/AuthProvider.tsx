import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ValidateTokenRequest,
  RefreshTokenRequest,
  AuthResponse,
  LogoutRequest,
  User,
} from "../api/gen/auth";
import { authClient } from "../api/grpc/authClient";
import { grpc } from "@improbable-eng/grpc-web";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
  getAuthMetadata(): grpc.Metadata;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = (response: AuthResponse) => {
    localStorage.setItem("access_token", response.accessToken);
    localStorage.setItem("refresh_token", response.refreshToken);
    setUser(response.user || null);
  };

  const logout = async () => {
    try {
      const req: LogoutRequest = {
        refreshToken: localStorage.getItem("refresh_token") || "",
        logoutAllDevices: true,
      };
      await authClient.Logout(req);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Always clear local state and tokens regardless of server response
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      navigate("/login");
    }
  };

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const authenticate = async () => {
      console.log("[Auth] Starting authentication process...");
      try {
        const accessToken = localStorage.getItem("access_token");
        const refreshTokenValue = localStorage.getItem("refresh_token");

        console.log(`[Auth] Tokens found - Access: ${!!accessToken}, Refresh: ${!!refreshTokenValue}`);

        if (!accessToken) {
          console.log("[Auth] No access token found. Attempting to refresh...");
          if (refreshTokenValue) {
            try {
              console.log("[Auth] Refresh token exists. Calling RefreshToken API...");
              const refreshReq: RefreshTokenRequest = { refreshToken: refreshTokenValue };
              const response = await authClient.RefreshToken(refreshReq);
              if (response.success && isMounted) {
                console.log("[Auth] Refresh successful. User set.");
                localStorage.setItem("access_token", response.accessToken);
                localStorage.setItem("refresh_token", response.refreshToken);
                setUser(response.user || null);
              } else {
                console.log("[Auth] Refresh API call failed or component unmounted.");
                setUser(null);
              }
            } catch (err) {
              console.error("[Auth] Token refresh failed:", err);
              setUser(null);
            }
          } else {
            console.log("[Auth] No tokens at all. Setting user to null.");
            setUser(null);
          }
        } else {
          // Access token exists, try to validate it.
          console.log("[Auth] Access token found. Validating...");
          const validateReq: ValidateTokenRequest = { accessToken };
          const response = await authClient.ValidateToken(validateReq);

          if (response.valid && isMounted) {
            console.log("[Auth] Token is valid. User set.");
            const user: User = {
              id: response.userId,
              email: response.email,
              username: response.username,
              displayName: "", bio: "", avatar: new Uint8Array(), isVerified: false, isPrivate: false,
              isActive: true, lastLoginAt: "", country: "", allowDuet: false, allowStitch: false,
              allowDownload: false, allowComments: false, createdAt: "", updatedAt: "",
            };
            setUser(user);
          } else {
            console.log("[Auth] Token is invalid. Clearing tokens.");
            // If validation fails, clear tokens and user state.
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Authentication process failed:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        console.log("[Auth] Finally block reached. Setting loading to false.");
        // This block is guaranteed to run, ensuring the loading state is always updated.
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    authenticate();

    // Cleanup function to run when the component unmounts
    return () => {
      console.log("[Auth] AuthProvider unmounted.");
      isMounted = false;
    };
  }, []); // Empty dependency array ensures this runs only once on mount

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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
