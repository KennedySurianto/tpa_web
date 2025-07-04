import React, { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import {
  DeleteUserRequest,
  GetUserByIdRequest,
  UpdateUserRequest,
  User,
  UserResponse,
} from "../../api/gen/user";

import { useAuth } from "../../utils/AuthProvider";

import { userClient } from "../../api/grpc/userClient";

import { useNavigate } from "react-router-dom";

import { avatarBytesToUrl } from "../../utils/avatarConverter";

import {
  UserIcon,
  Settings,
  Camera,
  Key,
  Mail,
  Calendar,
  Hash,
  Globe,
  FileText,
  Shield,
  Eye,
  MessageCircle,
  Copy,
  Download,
  Users,
  CheckCircle,
  Save,
  AlertTriangle,
  Check,
  Trash2,
  X,
} from "lucide-react";

// Helper function to format Unix timestamps
const formatTimestamp = (timestampStr: string | undefined): string => {
  if (!timestampStr) return "N/A";
  const timestampNum = Number.parseInt(timestampStr, 10);
  if (isNaN(timestampNum)) {
    return "Invalid date";
  }
  return new Date(timestampNum * 1000).toLocaleString();
};

// Helper function to generate random confirmation text
const generateRandomText = (): string => {
  const words = ["DELETE", "REMOVE", "CONFIRM", "ACCOUNT", "PERMANENT"];
  const numbers = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}-${numbers}`;
};

const EditProfilePage: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [formData, setFormData] = useState<User | null>(null);
  const [originalData, setOriginalData] = useState<User | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("👤");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>("");
  const [userInputText, setUserInputText] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>("");

  const navigate = useNavigate();

  // Check if form has changes
  const hasChanges = React.useMemo(() => {
    if (!formData || !originalData) return false;

    const compareFields = [
      "username",
      "displayName",
      "bio",
      "avatar",
      "country",
      "isPrivate",
      "isActive",
      "isVerified",
      "allowComments",
      "allowDuet",
      "allowStitch",
      "allowDownload",
    ];

    return compareFields.some(
      (field) => formData[field as keyof User] !== originalData[field as keyof User],
    );
  }, [formData, originalData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Generate new confirmation text when modal opens
  useEffect(() => {
    if (showDeleteModal) {
      setDeleteConfirmationText(generateRandomText());
      setUserInputText("");
      setDeleteError("");
    }
  }, [showDeleteModal]);

  // Effect to fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setErrorMessage("");

      if (!(authUser && authUser.id)) {
        console.warn("No authenticated user ID found.");
        setUserProfile(null);
        setErrorMessage("No authenticated user found. Please log in.");
        setIsLoading(false);
        return;
      }

      try {
        const req: GetUserByIdRequest = { id: authUser.id };
        const res: User = await userClient.GetUserById(req);
        console.log("Fetched user data:", res);
        setUserProfile(res);
      } catch (err) {
        console.error("Error fetching user:", err);
        setUserProfile(null);
        setErrorMessage("Failed to load profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [authUser]);

  // Effect to update formData and profilePicturePreview when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
      setOriginalData(userProfile);
      setProfilePicturePreview(avatarBytesToUrl(userProfile.avatar) || "👤");
    } else {
      setFormData(null);
      setOriginalData(null);
      setProfilePicturePreview("👤");
    }
  }, [userProfile]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));

    if (name === "avatar") {
      setProfilePicturePreview(value || "👤");
    }

    // Clear messages when user starts editing
    if (successMessage || errorMessage) {
      setSuccessMessage("");
      setErrorMessage("");
    }
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: checked } : null));

    // Clear messages when user starts editing
    if (successMessage || errorMessage) {
      setSuccessMessage("");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData) {
      setErrorMessage("Profile data is not available.");
      return;
    }

    if (!hasChanges) {
      setErrorMessage("No changes to save.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      console.log("Form submitted:", formData);
      const req: UpdateUserRequest = {
        id: Number(userProfile?.id) || 0,
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio,
        avatar: formData.avatar,
        isVerified: formData.isVerified,
        isPrivate: formData.isPrivate,
        isActive: formData.isActive,
        country: formData.country,
        allowDuet: formData.allowDuet,
        allowStitch: formData.allowStitch,
        allowDownload: formData.allowDownload,
        allowComments: formData.allowComments,
      };

      const res = await userClient.UpdateUser(req);
      if (res) {
        setSuccessMessage("Profile updated successfully!");
        setOriginalData(formData);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userProfile?.id) {
      setDeleteError("User ID not found.");
      return;
    }

    if (userInputText.trim() !== deleteConfirmationText) {
      setDeleteError("Confirmation text does not match. Please try again.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const req: DeleteUserRequest = {
        email: userProfile.email,
      };
      const res: UserResponse = await userClient.DeleteUser(req);
      if (res) {
        // Account deleted successfully
        setShowDeleteModal(false);
        setSuccessMessage("Account deleted successfully. You will be redirected shortly.");

        // Redirect to login page after a short delay
        setTimeout(() => {
          logout();
        }, 3000);
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setDeleteError("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProfilePictureError = () => {
    setProfilePicturePreview("👤");
  };

  const renderProfilePicture = () => {
    if (profilePicturePreview === "👤") {
      return (
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "4px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#8b949e",
            transition: "all 0.3s ease",
          }}
        >
          <UserIcon size={48} />
        </div>
      );
    }

    return (
      <img
        src={profilePicturePreview || "/placeholder.svg"}
        alt="Profile Picture"
        onError={handleProfilePictureError}
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          objectFit: "cover",
          border: "4px solid rgba(139, 92, 246, 0.3)",
          transition: "all 0.3s ease",
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          overflowY: "auto",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          color: "#ffffff",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
              textAlign: "center",
              color: "#8b949e",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "2px solid #8b5cf6",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "1rem",
              }}
            />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div
        style={{
          height: "100vh",
          overflowY: "auto",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          color: "#ffffff",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
              textAlign: "center",
              color: "#8b949e",
            }}
          >
            <AlertTriangle size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#ffffff", fontSize: "1.25rem" }}>
              Could not load profile data
            </h3>
            <p style={{ margin: "0 0 1.5rem 0", fontSize: "1rem" }}>Please try again later.</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: "0.9rem",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        color: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "2rem",
              fontWeight: "700",
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Edit Profile
          </h1>
          <p style={{ margin: "0", color: "#8b949e", fontSize: "1rem" }}>
            Update your personal information and account settings
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              fontWeight: "500",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#22c55e",
            }}
          >
            <Check size={16} />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              fontWeight: "500",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
            }}
          >
            <AlertTriangle size={16} />
            {errorMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            padding: "0.5rem",
            marginBottom: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <button
            onClick={() => setActiveTab("profile")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background:
                activeTab === "profile" ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "none",
              border: "none",
              color: activeTab === "profile" ? "#ffffff" : "#8b949e",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.9rem",
              fontWeight: "500",
              boxShadow: activeTab === "profile" ? "0 4px 15px rgba(139, 92, 246, 0.3)" : "none",
            }}
          >
            <UserIcon size={18} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background:
                activeTab === "settings" ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "none",
              border: "none",
              color: activeTab === "settings" ? "#ffffff" : "#8b949e",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.9rem",
              fontWeight: "500",
              boxShadow: activeTab === "settings" ? "0 4px 15px rgba(139, 92, 246, 0.3)" : "none",
            }}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            backdropFilter: "blur(10px)",
            overflow: "hidden",
          }}
        >
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div style={{ padding: "2rem" }}>
              {/* Profile Picture Section */}
              <div style={{ marginBottom: "2.5rem" }}>
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Camera size={20} />
                  Profile Picture
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1.5rem",
                  }}
                >
                  <div style={{ position: "relative" }}>{renderProfilePicture()}</div>
                  <div style={{ textAlign: "center" }}>
                    <label
                      htmlFor="avatar"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                        color: "#ffffff",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                      }}
                    >
                      <Camera size={16} />
                      Upload New Picture
                    </label>
                    <input
                      type="file"
                      id="avatar"
                      name="avatar"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const buffer = await file.arrayBuffer();
                        const bytes = new Uint8Array(buffer);
                        setFormData((prev) => (prev ? { ...prev, avatar: bytes } : null));

                        // Update preview
                        const base64 = btoa(String.fromCharCode(...bytes));
                        setProfilePicturePreview(`data:${file.type};base64,${base64}`);
                      }}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div style={{ marginBottom: "2.5rem" }}>
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <UserIcon size={20} />
                  Personal Information
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      htmlFor="username"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#ffffff",
                      }}
                    >
                      <Hash size={14} />
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username || ""}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        transition: "all 0.2s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#8b5cf6";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      htmlFor="displayName"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#ffffff",
                      }}
                    >
                      <UserIcon size={14} />
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName || ""}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        transition: "all 0.2s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#8b5cf6";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      htmlFor="country"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#ffffff",
                      }}
                    >
                      <Globe size={14} />
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country || ""}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        transition: "all 0.2s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#8b5cf6";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label
                    htmlFor="bio"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      color: "#ffffff",
                    }}
                  >
                    <FileText size={14} />
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                      resize: "vertical",
                      minHeight: "100px",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#8b5cf6";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }}
                  />
                </div>
              </div>

              {/* Account Information Section (Read-only) */}
              <div style={{ marginBottom: "0" }}>
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Shield size={20} />
                  Account Information
                </h2>

                <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#8b949e",
                      }}
                    >
                      <Hash size={14} />
                      User ID
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#ffffff", textAlign: "right" }}>
                      {formData.id}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#8b949e",
                      }}
                    >
                      <Mail size={14} />
                      Email Address
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#ffffff", textAlign: "right" }}>
                      {formData.email}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#8b949e",
                      }}
                    >
                      <Calendar size={14} />
                      Last Login
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#ffffff", textAlign: "right" }}>
                      {formatTimestamp(formData.lastLoginAt)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#8b949e",
                      }}
                    >
                      <Calendar size={14} />
                      Member Since
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#ffffff", textAlign: "right" }}>
                      {formatTimestamp(formData.createdAt)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      color: "#8b949e",
                    }}
                  >
                    <Key size={14} />
                    Password
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      color: "#3b82f6",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontSize: "0.8rem",
                      fontWeight: "500",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                    }}
                  >
                    <Key size={16} />
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div style={{ padding: "2rem" }}>
              {/* Account Settings Section */}
              <div style={{ marginBottom: "2.5rem" }}>
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Shield size={20} />
                  Account Settings
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.5rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#ffffff",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <Eye size={16} />
                        Private Account
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#8b949e",
                          lineHeight: 1.4,
                        }}
                      >
                        Only approved followers can see your content
                      </div>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "48px",
                        height: "24px",
                        marginLeft: "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isPrivate"
                        checked={formData.isPrivate || false}
                        onChange={handleCheckboxChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: formData.isPrivate
                            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                            : "rgba(255, 255, 255, 0.1)",
                          border: `1px solid ${formData.isPrivate ? "transparent" : "rgba(255, 255, 255, 0.2)"}`,
                          transition: "all 0.3s ease",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: '""',
                            height: "18px",
                            width: "18px",
                            left: "2px",
                            bottom: "2px",
                            background: "#ffffff",
                            transition: "all 0.3s ease",
                            borderRadius: "50%",
                            transform: formData.isPrivate ? "translateX(24px)" : "translateX(0)",
                          }}
                        />
                      </span>
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.5rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#ffffff",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <Users size={16} />
                        Account Active
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#8b949e",
                          lineHeight: 1.4,
                        }}
                      >
                        Your account is active and visible to others
                      </div>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "48px",
                        height: "24px",
                        marginLeft: "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive || false}
                        onChange={handleCheckboxChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: formData.isActive
                            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                            : "rgba(255, 255, 255, 0.1)",
                          border: `1px solid ${formData.isActive ? "transparent" : "rgba(255, 255, 255, 0.2)"}`,
                          transition: "all 0.3s ease",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: '""',
                            height: "18px",
                            width: "18px",
                            left: "2px",
                            bottom: "2px",
                            background: "#ffffff",
                            transition: "all 0.3s ease",
                            borderRadius: "50%",
                            transform: formData.isActive ? "translateX(24px)" : "translateX(0)",
                          }}
                        />
                      </span>
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.5rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#ffffff",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <CheckCircle size={16} />
                        Verified Account
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#8b949e",
                          lineHeight: 1.4,
                        }}
                      >
                        Your account has been verified
                      </div>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "48px",
                        height: "24px",
                        marginLeft: "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isVerified"
                        checked={formData.isVerified || false}
                        onChange={handleCheckboxChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: formData.isVerified
                            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                            : "rgba(255, 255, 255, 0.1)",
                          border: `1px solid ${formData.isVerified ? "transparent" : "rgba(255, 255, 255, 0.2)"}`,
                          transition: "all 0.3s ease",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: '""',
                            height: "18px",
                            width: "18px",
                            left: "2px",
                            bottom: "2px",
                            background: "#ffffff",
                            transition: "all 0.3s ease",
                            borderRadius: "50%",
                            transform: formData.isVerified ? "translateX(24px)" : "translateX(0)",
                          }}
                        />
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Content Settings Section */}
              <div style={{ marginBottom: "2.5rem" }}>
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Settings size={20} />
                  Content Settings
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.5rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#ffffff",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <MessageCircle size={16} />
                        Allow Comments
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#8b949e",
                          lineHeight: 1.4,
                        }}
                      >
                        Others can comment on your videos
                      </div>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "48px",
                        height: "24px",
                        marginLeft: "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="allowComments"
                        checked={(formData.allowComments as boolean) || false}
                        onChange={handleCheckboxChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: formData.allowComments
                            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                            : "rgba(255, 255, 255, 0.1)",
                          border: `1px solid ${formData.allowComments ? "transparent" : "rgba(255, 255, 255, 0.2)"}`,
                          transition: "all 0.3s ease",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: '""',
                            height: "18px",
                            width: "18px",
                            left: "2px",
                            bottom: "2px",
                            background: "#ffffff",
                            transition: "all 0.3s ease",
                            borderRadius: "50%",
                            transform: formData.allowComments
                              ? "translateX(24px)"
                              : "translateX(0)",
                          }}
                        />
                      </span>
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.5rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#ffffff",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <Copy size={16} />
                        Allow Duet
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#8b949e",
                          lineHeight: 1.4,
                        }}
                      >
                        Others can create duets with your videos
                      </div>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "48px",
                        height: "24px",
                        marginLeft: "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="allowDuet"
                        checked={(formData.allowDuet as boolean) || false}
                        onChange={handleCheckboxChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: formData.allowDuet
                            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                            : "rgba(255, 255, 255, 0.1)",
                          border: `1px solid ${formData.allowDuet ? "transparent" : "rgba(255, 255, 255, 0.2)"}`,
                          transition: "all 0.3s ease",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: '""',
                            height: "18px",
                            width: "18px",
                            left: "2px",
                            bottom: "2px",
                            background: "#ffffff",
                            transition: "all 0.3s ease",
                            borderRadius: "50%",
                            transform: formData.allowDuet ? "translateX(24px)" : "translateX(0)",
                          }}
                        />
                      </span>
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.5rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#ffffff",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <Copy size={16} />
                        Allow Stitch
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#8b949e",
                          lineHeight: 1.4,
                        }}
                      >
                        Others can stitch parts of your videos
                      </div>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "48px",
                        height: "24px",
                        marginLeft: "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="allowStitch"
                        checked={(formData.allowStitch as boolean) || false}
                        onChange={handleCheckboxChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: formData.allowStitch
                            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                            : "rgba(255, 255, 255, 0.1)",
                          border: `1px solid ${formData.allowStitch ? "transparent" : "rgba(255, 255, 255, 0.2)"}`,
                          transition: "all 0.3s ease",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: '""',
                            height: "18px",
                            width: "18px",
                            left: "2px",
                            bottom: "2px",
                            background: "#ffffff",
                            transition: "all 0.3s ease",
                            borderRadius: "50%",
                            transform: formData.allowStitch ? "translateX(24px)" : "translateX(0)",
                          }}
                        />
                      </span>
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.5rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#ffffff",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <Download size={16} />
                        Allow Downloads
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#8b949e",
                          lineHeight: 1.4,
                        }}
                      >
                        Others can download your videos
                      </div>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "48px",
                        height: "24px",
                        marginLeft: "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="allowDownload"
                        checked={(formData.allowDownload as boolean) || false}
                        onChange={handleCheckboxChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: formData.allowDownload
                            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                            : "rgba(255, 255, 255, 0.1)",
                          border: `1px solid ${formData.allowDownload ? "transparent" : "rgba(255, 255, 255, 0.2)"}`,
                          transition: "all 0.3s ease",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: '""',
                            height: "18px",
                            width: "18px",
                            left: "2px",
                            bottom: "2px",
                            background: "#ffffff",
                            transition: "all 0.3s ease",
                            borderRadius: "50%",
                            transform: formData.allowDownload
                              ? "translateX(24px)"
                              : "translateX(0)",
                          }}
                        />
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Danger Zone Section */}
              <div style={{ marginBottom: "0" }}>
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#ef4444",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <AlertTriangle size={20} />
                  Danger Zone
                </h2>

                <div
                  style={{
                    padding: "1.5rem",
                    background: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ marginBottom: "1rem" }}>
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#ef4444",
                      }}
                    >
                      Delete Account
                    </h3>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "0.875rem",
                        color: "#8b949e",
                        lineHeight: 1.5,
                      }}
                    >
                      Once you delete your account, there is no going back. This will permanently
                      delete your account, all your videos, and remove all associated data.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#ef4444",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                    }}
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div
            style={{
              padding: "2rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="submit"
              disabled={!hasChanges || isSaving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background:
                  hasChanges && !isSaving
                    ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                    : "rgba(75, 85, 99, 0.5)",
                border: "none",
                color: hasChanges && !isSaving ? "#ffffff" : "#9ca3af",
                padding: "0.75rem 2rem",
                borderRadius: "8px",
                cursor: hasChanges && !isSaving ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                fontSize: "0.9rem",
                fontWeight: "600",
                opacity: isSaving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (hasChanges && !isSaving) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (hasChanges && !isSaving) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {isSaving ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteModal(false);
              }
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "16px",
                padding: "2rem",
                maxWidth: "500px",
                width: "100%",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "2px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.5rem",
                  }}
                >
                  <AlertTriangle size={32} style={{ color: "#ef4444" }} />
                </div>
                <h2
                  style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#ef4444",
                  }}
                >
                  Delete Account
                </h2>
                <p
                  style={{
                    margin: "0",
                    fontSize: "1rem",
                    color: "#8b949e",
                    lineHeight: 1.5,
                  }}
                >
                  This action cannot be undone. This will permanently delete your account and remove
                  all your data.
                </p>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <p
                  style={{
                    margin: "0 0 1rem 0",
                    fontSize: "0.875rem",
                    color: "#ffffff",
                    fontWeight: "500",
                  }}
                >
                  To confirm deletion, please type the following text exactly:
                </p>
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  <code
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color: "#ef4444",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {deleteConfirmationText}
                  </code>
                </div>
                <input
                  type="text"
                  value={userInputText}
                  onChange={(e) => {
                    setUserInputText(e.target.value);
                    setDeleteError("");
                  }}
                  placeholder="Type the confirmation text here"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${deleteError ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                  }}
                  onFocus={(e) => {
                    if (!deleteError) {
                      e.currentTarget.style.borderColor = "#8b5cf6";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!deleteError) {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                />
                {deleteError && (
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.8rem",
                      color: "#ef4444",
                    }}
                  >
                    {deleteError}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || userInputText.trim() !== deleteConfirmationText}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background:
                      !isDeleting && userInputText.trim() === deleteConfirmationText
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(75, 85, 99, 0.5)",
                    border: `1px solid ${
                      !isDeleting && userInputText.trim() === deleteConfirmationText
                        ? "rgba(239, 68, 68, 0.5)"
                        : "rgba(75, 85, 99, 0.5)"
                    }`,
                    color:
                      !isDeleting && userInputText.trim() === deleteConfirmationText
                        ? "#ef4444"
                        : "#9ca3af",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    cursor:
                      !isDeleting && userInputText.trim() === deleteConfirmationText
                        ? "pointer"
                        : "not-allowed",
                    transition: "all 0.2s ease",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting && userInputText.trim() === deleteConfirmationText) {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.7)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting && userInputText.trim() === deleteConfirmationText) {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                    }
                  }}
                >
                  {isDeleting ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(239, 68, 68, 0.3)",
                          borderTop: "2px solid #ef4444",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .edit-profile-page {
            padding: 1rem;
          }

          .tab-content {
            padding: 1.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .toggle-switch {
            margin-left: 0;
            align-self: flex-end;
          }

          .info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .info-value {
            text-align: left;
          }

          .password-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 1.5rem;
          }

          .tab-navigation {
            flex-direction: column;
            gap: 0.5rem;
          }

          .tab-button {
            justify-content: flex-start;
          }

          .profile-picture-section {
            gap: 1rem;
          }

          .profile-picture-image,
          .profile-picture-placeholder {
            width: 100px;
            height: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default EditProfilePage;
