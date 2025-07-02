import React, { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { GetUserByIdRequest, UpdateUserRequest, User } from "../../api/gen/user";
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
  Loader2,
  Save,
  AlertTriangle,
  Check,
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

const EditProfilePage: React.FC = () => {
  const authUser = useAuth().user;
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [formData, setFormData] = useState<User | null>(null);
  const [originalData, setOriginalData] = useState<User | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("👤");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
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

  const handleProfilePictureError = () => {
    setProfilePicturePreview("👤");
  };

  const renderProfilePicture = () => {
    if (profilePicturePreview === "👤") {
      return (
        <div className="profile-picture-placeholder">
          <UserIcon size={48} />
        </div>
      );
    }

    return (
      <img
        src={profilePicturePreview || "/placeholder.svg"}
        alt="Profile Picture"
        onError={handleProfilePictureError}
        className="profile-picture-image"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="edit-profile-page">
        <div className="page-container">
          <div className="loading-container">
            <Loader2 size={32} className="loading-spinner" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="edit-profile-page">
        <div className="page-container">
          <div className="error-container">
            <AlertTriangle size={48} className="error-icon" />
            <h3>Could not load profile data</h3>
            <p>Please try again later.</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Edit Profile</h1>
          <p className="page-subtitle">Update your personal information and account settings</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="message success-message">
            <Check size={16} />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="message error-message">
            <AlertTriangle size={16} />
            {errorMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <UserIcon size={18} />
            Profile
          </button>
          <button
            className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="tab-content">
              {/* Profile Picture Section */}
              <div className="form-section">
                <h2 className="section-title">
                  <Camera size={20} />
                  Profile Picture
                </h2>
                <div className="profile-picture-section">
                  <div className="profile-picture-container">{renderProfilePicture()}</div>
                  <div className="profile-picture-upload">
                    <label htmlFor="avatar" className="upload-label">
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
                      className="file-input"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="form-section">
                <h2 className="section-title">
                  <UserIcon size={20} />
                  Personal Information
                </h2>
                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="username" className="input-label">
                      <Hash size={14} />
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username || ""}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="displayName" className="input-label">
                      <UserIcon size={14} />
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName || ""}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="country" className="input-label">
                      <Globe size={14} />
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country || ""}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="bio" className="input-label">
                    <FileText size={14} />
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {/* Account Information Section (Read-only) */}
              <div className="form-section">
                <h2 className="section-title">
                  <Shield size={20} />
                  Account Information
                </h2>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      <Hash size={14} />
                      User ID
                    </div>
                    <div className="info-value">{formData.id}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      <Mail size={14} />
                      Email Address
                    </div>
                    <div className="info-value">{formData.email}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      <Calendar size={14} />
                      Last Login
                    </div>
                    <div className="info-value">{formatTimestamp(formData.lastLoginAt)}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      <Calendar size={14} />
                      Member Since
                    </div>
                    <div className="info-value">{formatTimestamp(formData.createdAt)}</div>
                  </div>
                </div>

                <div className="password-section">
                  <div className="info-label">
                    <Key size={14} />
                    Password
                  </div>
                  <button
                    type="button"
                    className="change-password-button"
                    onClick={() => navigate("/forgot-password")}
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
            <div className="tab-content">
              {/* Account Settings Section */}
              <div className="form-section">
                <h2 className="section-title">
                  <Shield size={20} />
                  Account Settings
                </h2>
                <div className="settings-grid">
                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-label">
                        <Eye size={16} />
                        Private Account
                      </div>
                      <div className="setting-description">
                        Only approved followers can see your content
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="isPrivate"
                        checked={formData.isPrivate || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-label">
                        <Users size={16} />
                        Account Active
                      </div>
                      <div className="setting-description">
                        Your account is active and visible to others
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-label">
                        <CheckCircle size={16} />
                        Verified Account
                      </div>
                      <div className="setting-description">Your account has been verified</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="isVerified"
                        checked={formData.isVerified || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Content Settings Section */}
              <div className="form-section">
                <h2 className="section-title">
                  <Settings size={20} />
                  Content Settings
                </h2>
                <div className="settings-grid">
                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-label">
                        <MessageCircle size={16} />
                        Allow Comments
                      </div>
                      <div className="setting-description">Others can comment on your videos</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="allowComments"
                        checked={(formData.allowComments as boolean) || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-label">
                        <Copy size={16} />
                        Allow Duet
                      </div>
                      <div className="setting-description">
                        Others can create duets with your videos
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="allowDuet"
                        checked={(formData.allowDuet as boolean) || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-label">
                        <Copy size={16} />
                        Allow Stitch
                      </div>
                      <div className="setting-description">
                        Others can stitch parts of your videos
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="allowStitch"
                        checked={(formData.allowStitch as boolean) || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-label">
                        <Download size={16} />
                        Allow Downloads
                      </div>
                      <div className="setting-description">Others can download your videos</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="allowDownload"
                        checked={(formData.allowDownload as boolean) || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-footer">
            <button type="submit" disabled={!hasChanges || isSaving} className="save-button">
              {isSaving ? (
                <>
                  <Loader2 size={16} className="button-spinner" />
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
      </div>

      <style>{`
        .edit-profile-page {
          height: 100vh;
          overflow-y: auto;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 2rem;
        }

        .page-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          text-align: center;
          color: #8b949e;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          color: #8b5cf6;
          margin-bottom: 1rem;
        }

        .error-icon {
          color: #ef4444;
          margin-bottom: 1rem;
        }

        .error-container h3 {
          margin: 0 0 0.5rem 0;
          color: #ffffff;
          font-size: 1.25rem;
        }

        .error-container p {
          margin: 0 0 1.5rem 0;
          font-size: 1rem;
        }

        .retry-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .retry-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .page-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .page-title {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          margin: 0;
          color: #8b949e;
          font-size: 1rem;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .success-message {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .tab-navigation {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0.5rem;
          margin-bottom: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: #8b949e;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .tab-button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .tab-button.active {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: #ffffff;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .profile-form {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          overflow: hidden;
        }

        .tab-content {
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 2.5rem;
        }

        .form-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .profile-picture-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .profile-picture-container {
          position: relative;
        }

        .profile-picture-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid rgba(139, 92, 246, 0.3);
          transition: all 0.3s ease;
        }

        .profile-picture-image:hover {
          border-color: rgba(139, 92, 246, 0.6);
          transform: scale(1.05);
        }

        .profile-picture-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          color: #8b949e;
          transition: all 0.3s ease;
        }

        .profile-picture-placeholder:hover {
          border-color: rgba(139, 92, 246, 0.3);
          background: rgba(139, 92, 246, 0.1);
        }

        .profile-picture-upload {
          text-align: center;
        }

        .upload-label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .upload-label:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .file-input {
          display: none;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #ffffff;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #8b949e;
        }

        .info-value {
          font-size: 0.9rem;
          color: #ffffff;
          text-align: right;
        }

        .password-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .change-password-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .change-password-button:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .setting-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .setting-info {
          flex: 1;
        }

        .setting-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .setting-description {
          font-size: 0.8rem;
          color: #8b949e;
          line-height: 1.4;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
          margin-left: 1rem;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 2px;
          bottom: 2px;
          background: #ffffff;
          transition: all 0.3s ease;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          border-color: transparent;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .form-footer {
          padding: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          justify-content: flex-end;
        }

        .save-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          border: none;
          color: #ffffff;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .save-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .button-spinner {
          animation: spin 1s linear infinite;
        }

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
