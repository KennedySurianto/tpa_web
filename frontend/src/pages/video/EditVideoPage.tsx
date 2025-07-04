import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  ImageIcon,
  Eye,
  EyeOff,
  FileText,
  VideoIcon,
  AlertCircle,
  Check,
  X,
  MessageCircle,
  Copy,
  Scissors,
  Lock,
} from "lucide-react";
import { videoClient } from "../../api/grpc/videoClient";
import { useAuth } from "../../utils/AuthProvider";
import type {
  GetVideoRequest,
  GetVideoResponse,
  UpdateVideoRequest,
  UpdateVideoResponse,
  Video,
} from "../../api/gen/video";
import { avatarBytesToUrl } from "../../utils/avatarConverter";

type EditVideoPageProps = {};

interface FormData extends Omit<UpdateVideoRequest, "id"> {
  id: number;
}

const EditVideoPage: React.FC<EditVideoPageProps> = () => {
  const { user, getAuthMetadata } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ videoId: string }>();
  const videoId = params?.videoId;

  // State management with proper TypeScript types
  const [video, setVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<FormData>({
    id: 0,
    caption: "",
    privacy: "public",
    allowComments: true,
    allowDuet: true,
    allowStitch: false,
    isPublished: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Fetch video data
  const fetchVideo = useCallback(async (): Promise<void> => {
    if (!videoId || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const req: GetVideoRequest = {
        videoId: videoId,
        currentUserId: user.id,
      };

      const res: GetVideoResponse = await videoClient.GetVideo(req, getAuthMetadata());

      if (res && res.video) {
        const video: Video = res.video;
        setVideo(video);

        // Check if current user is the owner of the video
        const videoOwner = String(video.userId) === String(user.id);
        setIsOwner(videoOwner);

        if (videoOwner) {
          setFormData({
            id: video.id,
            caption: video.caption || "",
            privacy: video.privacy || "public",
            allowComments: video.allowComments ?? true,
            allowDuet: video.allowDuet ?? true,
            allowStitch: video.allowStitch ?? false,
            isPublished: video.isPublished ?? false,
          });

          // Set thumbnail preview if exists
          if (video.thumbnail) {
            const thumbnailUrl = avatarBytesToUrl(video.thumbnail);
            if (thumbnailUrl) {
              setThumbnailPreview(thumbnailUrl);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch video:", err);
      setError("Failed to load video. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [videoId, user?.id, getAuthMetadata]);

  useEffect(() => {
    if (user?.id && videoId) {
      fetchVideo();
    }
  }, [user?.id, videoId, fetchVideo]);

  // Handle form changes
  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  }, []);

  // Handle thumbnail upload
  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Thumbnail file size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      setThumbnailFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          setThumbnailPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      setHasChanges(true);
      setError(null);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      if (!video || !videoId || !isOwner) return;

      console.log("videoId: ", videoId);

      setSaving(true);
      setError(null);
      setSuccess(null);

      try {
        // Convert thumbnail to bytes if uploaded
        let thumbnailBytes: Uint8Array | undefined;
        if (thumbnailFile) {
          const arrayBuffer = await thumbnailFile.arrayBuffer();
          thumbnailBytes = new Uint8Array(arrayBuffer);
        }

        const req: UpdateVideoRequest = {
          id: Number(videoId),
          caption: formData.caption,
          privacy: formData.privacy,
          allowComments: formData.allowComments,
          allowDuet: formData.allowDuet,
          allowStitch: formData.allowStitch,
          isPublished: formData.isPublished,
          ...(thumbnailBytes && { thumbnail: thumbnailBytes }),
        };

        const res: UpdateVideoResponse = await videoClient.UpdateVideo(req, getAuthMetadata());

        if (res && res.video) {
          setSuccess("Video updated successfully!");
          setHasChanges(false);
          await fetchVideo();
        }
      } catch (err) {
        console.error("Failed to update video:", err);
        setError("Failed to update video. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [video, videoId, formData, thumbnailFile, getAuthMetadata, fetchVideo, isOwner],
  );

  // Handle navigation with unsaved changes warning
  const handleNavigation = useCallback(
    (path: string): void => {
      if (hasChanges && isOwner) {
        if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
          navigate(path);
        }
      } else {
        navigate(path);
      }
    },
    [hasChanges, navigate, isOwner],
  );

  // Format date
  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
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
            }}
          />
          <p style={{ color: "white" }}>Loading video...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error && !video) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(31, 41, 55, 0.5)",
            border: "1px solid #374151",
            backdropFilter: "blur(10px)",
            borderRadius: "0.75rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <AlertCircle
            style={{ width: "48px", height: "48px", color: "#ef4444", margin: "0 auto 1rem" }}
          />
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "white",
              marginBottom: "0.5rem",
              margin: 0,
            }}
          >
            Error Loading Video
          </h2>
          <p style={{ color: "#9ca3af", marginBottom: "1.5rem", margin: "0.5rem 0 1.5rem 0" }}>
            {error}
          </p>
          <button
            onClick={() => navigate("/manage-videos")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              color: "white",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.875rem",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px", marginRight: "0.5rem" }} />
            Back to Manage Videos
          </button>
        </div>
      </div>
    );
  }

  // Not owner view - Read-only video details
  if (video && !isOwner) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          color: "white",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "2rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                onClick={() => navigate("/manage-videos")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.625rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #4b5563",
                  background: "rgba(31, 41, 55, 0.5)",
                  color: "white",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontSize: "0.875rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(55, 65, 81, 0.8)";
                  e.currentTarget.style.borderColor = "#6b7280";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(31, 41, 55, 0.5)";
                  e.currentTarget.style.borderColor = "#4b5563";
                }}
              >
                <ArrowLeft style={{ width: "16px", height: "16px", marginRight: "0.5rem" }} />
                Back
              </button>
              <div>
                <h1
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    margin: 0,
                  }}
                >
                  Video Details
                </h1>
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.875rem",
                    marginTop: "0.25rem",
                    margin: "0.25rem 0 0 0",
                  }}
                >
                  Created {formatDate(video.createdAt?.toString())}
                </p>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.75rem",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "0.5rem",
                color: "#ef4444",
                fontSize: "0.875rem",
              }}
            >
              <Lock style={{ width: "16px", height: "16px" }} />
              Read Only - Not Your Video
            </div>
          </div>

          {/* Video Preview - Read Only */}
          <div
            style={{
              backgroundColor: "rgba(31, 41, 55, 0.5)",
              border: "1px solid #374151",
              backdropFilter: "blur(10px)",
              borderRadius: "0.75rem",
              marginBottom: "2rem",
            }}
          >
            <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "white",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <VideoIcon style={{ width: "20px", height: "20px" }} />
                Video Preview
              </h3>
            </div>
            <div style={{ padding: "0 1.5rem 1.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 1fr",
                  gap: "1.5rem",
                  alignItems: "start",
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    aspectRatio: "3/4",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    background: "#111827",
                    border: "1px solid #374151",
                  }}
                >
                  {video.thumbnail ? (
                    <img
                      src={avatarBytesToUrl(video.thumbnail) || "/placeholder.svg"}
                      alt="Video thumbnail"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6b7280",
                      }}
                    >
                      <VideoIcon style={{ width: "32px", height: "32px" }} />
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        ...(video.isPublished
                          ? {
                              backgroundColor: "rgba(34, 197, 94, 0.2)",
                              color: "#22c55e",
                              border: "1px solid rgba(34, 197, 94, 0.3)",
                            }
                          : {
                              backgroundColor: "rgba(251, 191, 36, 0.2)",
                              color: "#fbbf24",
                              border: "1px solid rgba(251, 191, 36, 0.3)",
                            }),
                      }}
                    >
                      {video.isPublished ? "Published" : "Draft"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "1rem",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                        {video.likeCount || 0}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Likes</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                        {video.viewsCount || 0}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Views</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                        {video.commentsCount || 0}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Comments</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Details - Read Only */}
          <div
            style={{
              backgroundColor: "rgba(31, 41, 55, 0.5)",
              border: "1px solid #374151",
              backdropFilter: "blur(10px)",
              borderRadius: "0.75rem",
            }}
          >
            <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "white",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FileText style={{ width: "20px", height: "20px" }} />
                Video Details
              </h3>
            </div>
            <div
              style={{
                padding: "0 1.5rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Caption */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "white",
                    marginBottom: "0.5rem",
                  }}
                >
                  Caption
                </label>
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(17, 24, 39, 0.3)",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                    color: "#d1d5db",
                    fontSize: "0.875rem",
                  }}
                >
                  {video.caption || "No caption"}
                </div>
              </div>

              {/* Privacy */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "white",
                    marginBottom: "0.5rem",
                  }}
                >
                  Privacy
                </label>
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(17, 24, 39, 0.3)",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                    color: "#d1d5db",
                    fontSize: "0.875rem",
                    textTransform: "capitalize",
                  }}
                >
                  {video.privacy || "Public"}
                </div>
              </div>

              {/* Interaction Settings */}
              <div>
                <h4
                  style={{
                    fontSize: "1rem",
                    fontWeight: "500",
                    color: "white",
                    marginBottom: "1rem",
                    margin: "0 0 1rem 0",
                  }}
                >
                  Interaction Settings
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <MessageCircle style={{ width: "16px", height: "16px", color: "#9ca3af" }} />
                    <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>
                      Comments: {video.allowComments ? "Allowed" : "Disabled"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Copy style={{ width: "16px", height: "16px", color: "#9ca3af" }} />
                    <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>
                      Duets: {video.allowDuet ? "Allowed" : "Disabled"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Scissors style={{ width: "16px", height: "16px", color: "#9ca3af" }} />
                    <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>
                      Stitches: {video.allowStitch ? "Allowed" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Owner view - Editable form
  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        color: "white",
        padding: "1rem",
      }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => handleNavigation("/manage-videos")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.625rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #4b5563",
                background: "rgba(31, 41, 55, 0.5)",
                color: "white",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(55, 65, 81, 0.8)";
                e.currentTarget.style.borderColor = "#6b7280";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(31, 41, 55, 0.5)";
                e.currentTarget.style.borderColor = "#4b5563";
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px", marginRight: "0.5rem" }} />
              Back
            </button>
            <div>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  margin: 0,
                }}
              >
                Edit Video
              </h1>
              {video && (
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.875rem",
                    marginTop: "0.25rem",
                    margin: "0.25rem 0 0 0",
                  }}
                >
                  Created {formatDate(video.createdAt?.toString())} | Last Updated{" "}
                  {formatDate(video.updatedAt?.toString())}
                </p>
              )}
            </div>
          </div>
          {hasChanges && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.75rem",
                background: "rgba(251, 191, 36, 0.1)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                borderRadius: "0.5rem",
                color: "#fbbf24",
                fontSize: "0.875rem",
              }}
            >
              <AlertCircle style={{ width: "16px", height: "16px" }} />
              Unsaved changes
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              marginBottom: "1.5rem",
            }}
          >
            <X
              style={{
                width: "16px",
                height: "16px",
                color: "#ef4444",
                flexShrink: 0,
                marginTop: "0.125rem",
              }}
            />
            <div style={{ fontSize: "0.875rem", color: "#ef4444" }}>{error}</div>
          </div>
        )}

        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              marginBottom: "1.5rem",
            }}
          >
            <Check
              style={{
                width: "16px",
                height: "16px",
                color: "#22c55e",
                flexShrink: 0,
                marginTop: "0.125rem",
              }}
            />
            <div style={{ fontSize: "0.875rem", color: "#22c55e" }}>{success}</div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
        >
          {/* Video Preview */}
          {video && (
            <div
              style={{
                backgroundColor: "rgba(31, 41, 55, 0.5)",
                border: "1px solid #374151",
                backdropFilter: "blur(10px)",
                borderRadius: "0.75rem",
              }}
            >
              <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "white",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <VideoIcon style={{ width: "20px", height: "20px" }} />
                  Video Preview
                </h3>
              </div>
              <div style={{ padding: "0 1.5rem 1.5rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    gap: "1.5rem",
                    alignItems: "start",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      aspectRatio: "3/4",
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                      background: "#111827",
                      border: "1px solid #374151",
                    }}
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview || "/placeholder.svg"}
                        alt="Video thumbnail"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6b7280",
                        }}
                      >
                        <VideoIcon style={{ width: "32px", height: "32px" }} />
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          ...(video.isPublished
                            ? {
                                backgroundColor: "rgba(34, 197, 94, 0.2)",
                                color: "#22c55e",
                                border: "1px solid rgba(34, 197, 94, 0.3)",
                              }
                            : {
                                backgroundColor: "rgba(251, 191, 36, 0.2)",
                                color: "#fbbf24",
                                border: "1px solid rgba(251, 191, 36, 0.3)",
                              }),
                        }}
                      >
                        {video.isPublished ? "Published" : "Draft"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "1rem",
                        textAlign: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                          {video.likeCount || 0}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Likes</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                          {video.viewsCount || 0}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Views</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                          {video.commentsCount || 0}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Comments</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div
            style={{
              backgroundColor: "rgba(31, 41, 55, 0.5)",
              border: "1px solid #374151",
              backdropFilter: "blur(10px)",
              borderRadius: "0.75rem",
            }}
          >
            <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "white",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FileText style={{ width: "20px", height: "20px" }} />
                Video Details
              </h3>
            </div>
            <div
              style={{
                padding: "0 1.5rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Caption */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  htmlFor="caption"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "white",
                    marginBottom: "0.25rem",
                  }}
                >
                  Caption *
                </label>
                <input
                  id="caption"
                  type="text"
                  value={formData.caption || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("caption", e.target.value)
                  }
                  placeholder="Enter video caption..."
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(17, 24, 39, 0.5)",
                    border: "1px solid #4b5563",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontSize: "0.875rem",
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#8b5cf6";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#4b5563";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Privacy */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  htmlFor="privacy"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "white",
                    marginBottom: "0.25rem",
                  }}
                >
                  Privacy
                </label>
                <select
                  id="privacy"
                  value={formData.privacy || "public"}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleInputChange("privacy", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(17, 24, 39, 0.5)",
                    border: "1px solid #4b5563",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontSize: "0.875rem",
                    outline: "none",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#8b5cf6";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#4b5563";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="public" style={{ backgroundColor: "#1f2937", color: "white" }}>
                    🌍 Public
                  </option>
                  <option value="friends" style={{ backgroundColor: "#1f2937", color: "white" }}>
                    👥 Friends
                  </option>
                  <option value="private" style={{ backgroundColor: "#1f2937", color: "white" }}>
                    🔒 Private
                  </option>
                </select>
              </div>

              {/* Thumbnail Upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  htmlFor="thumbnail"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "white",
                    marginBottom: "0.25rem",
                  }}
                >
                  Thumbnail
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "1rem",
                      border: "2px dashed #4b5563",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#8b5cf6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#4b5563";
                    }}
                  >
                    <ImageIcon style={{ width: "20px", height: "20px", color: "#8b5cf6" }} />
                    <div>
                      <div style={{ fontWeight: "500" }}>
                        {thumbnailFile ? thumbnailFile.name : "Choose thumbnail image"}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                        PNG, JPG up to 5MB
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Publish Status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  background: "rgba(17, 24, 39, 0.5)",
                  borderRadius: "0.5rem",
                  border: "1px solid #4b5563",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {formData.isPublished ? (
                    <Eye style={{ width: "20px", height: "20px" }} />
                  ) : (
                    <EyeOff style={{ width: "20px", height: "20px" }} />
                  )}
                  <div>
                    <div style={{ fontWeight: "500" }}>Published</div>
                    <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                      Video is visible to everyone and not being saved as draft
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isPublished || false}
                  onClick={() => handleInputChange("isPublished", !(formData.isPublished || false))}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    height: "24px",
                    width: "44px",
                    alignItems: "center",
                    borderRadius: "12px",
                    transition: "background-color 0.2s",
                    border: "none",
                    cursor: "pointer",
                    outline: "none",
                    backgroundColor: formData.isPublished ? "#8b5cf6" : "#4b5563",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139, 92, 246, 0.5)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      height: "16px",
                      width: "16px",
                      transform: formData.isPublished ? "translateX(24px)" : "translateX(4px)",
                      borderRadius: "50%",
                      backgroundColor: "white",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
              </div>

              {/* Interaction Settings */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "500", margin: 0 }}>
                  Interaction Settings
                </h3>

                {/* Allow Comments */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    background: "rgba(17, 24, 39, 0.5)",
                    borderRadius: "0.5rem",
                    border: "1px solid #4b5563",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <MessageCircle style={{ width: "20px", height: "20px" }} />
                    <div>
                      <div style={{ fontWeight: "500" }}>Allow Comments</div>
                      <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                        Let people comment on your video
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.allowComments ?? true}
                    onClick={() =>
                      handleInputChange("allowComments", !(formData.allowComments ?? true))
                    }
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      height: "24px",
                      width: "44px",
                      alignItems: "center",
                      borderRadius: "12px",
                      transition: "background-color 0.2s",
                      border: "none",
                      cursor: "pointer",
                      outline: "none",
                      backgroundColor: formData.allowComments ? "#8b5cf6" : "#4b5563",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139, 92, 246, 0.5)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        height: "16px",
                        width: "16px",
                        transform: formData.allowComments ? "translateX(24px)" : "translateX(4px)",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>

                {/* Allow Duet */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    background: "rgba(17, 24, 39, 0.5)",
                    borderRadius: "0.5rem",
                    border: "1px solid #4b5563",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Copy style={{ width: "20px", height: "20px" }} />
                    <div>
                      <div style={{ fontWeight: "500" }}>Allow Duet</div>
                      <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                        Let people create duets with your video
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.allowDuet ?? true}
                    onClick={() => handleInputChange("allowDuet", !(formData.allowDuet ?? true))}
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      height: "24px",
                      width: "44px",
                      alignItems: "center",
                      borderRadius: "12px",
                      transition: "background-color 0.2s",
                      border: "none",
                      cursor: "pointer",
                      outline: "none",
                      backgroundColor: formData.allowDuet ? "#8b5cf6" : "#4b5563",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139, 92, 246, 0.5)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        height: "16px",
                        width: "16px",
                        transform: formData.allowDuet ? "translateX(24px)" : "translateX(4px)",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>

                {/* Allow Stitch */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    background: "rgba(17, 24, 39, 0.5)",
                    borderRadius: "0.5rem",
                    border: "1px solid #4b5563",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Scissors style={{ width: "20px", height: "20px" }} />
                    <div>
                      <div style={{ fontWeight: "500" }}>Allow Stitch</div>
                      <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                        Let people stitch parts of your video
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.allowStitch ?? false}
                    onClick={() =>
                      handleInputChange("allowStitch", !(formData.allowStitch ?? false))
                    }
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      height: "24px",
                      width: "44px",
                      alignItems: "center",
                      borderRadius: "12px",
                      transition: "background-color 0.2s",
                      border: "none",
                      cursor: "pointer",
                      outline: "none",
                      backgroundColor: formData.allowStitch ? "#8b5cf6" : "#4b5563",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139, 92, 246, 0.5)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        height: "16px",
                        width: "16px",
                        transform: formData.allowStitch ? "translateX(24px)" : "translateX(4px)",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => handleNavigation("/manage-videos")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #4b5563",
                background: "rgba(31, 41, 55, 0.5)",
                color: "white",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(55, 65, 81, 0.8)";
                e.currentTarget.style.borderColor = "#6b7280";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(31, 41, 55, 0.5)";
                e.currentTarget.style.borderColor = "#4b5563";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                background:
                  hasChanges && !saving
                    ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                    : "rgba(75, 85, 99, 0.5)",
                color: hasChanges && !saving ? "white" : "#9ca3af",
                fontWeight: "600",
                cursor: hasChanges && !saving ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                fontSize: "0.875rem",
                opacity: saving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (hasChanges && !saving) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (hasChanges && !saving) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {saving ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      marginRight: "0.5rem",
                    }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save style={{ width: "16px", height: "16px", marginRight: "0.5rem" }} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .video-preview-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default EditVideoPage;
