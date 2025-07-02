import type React from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SortAsc,
  SortDesc,
  Heart,
  Eye,
  MessageCircle,
  Edit,
  Trash2,
  Video,
  FileText,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../utils/AuthProvider";
import type {
  GetVideosByUserIdRequest,
  GetVideosResponse,
  Video as VideoType,
  DeleteVideoRequest,
} from "../../api/gen/video";
import { videoClient } from "../../api/grpc/videoClient";
import { avatarBytesToUrl } from "../../utils/avatarConverter";
import debounce from "../../utils/debounce";

type SortField = "likes" | "views" | "comments" | "date";
type SortOrder = "asc" | "desc";
type VideoStatus = "published" | "draft";

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

const ManageVideosPage: React.FC = () => {
  const { user, isAuthenticated, getAuthMetadata } = useAuth();
  const navigate = useNavigate();

  // State management
  const [publishedVideos, setPublishedVideos] = useState<VideoType[]>([]);
  const [draftVideos, setDraftVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<VideoStatus>("published");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "date", order: "desc" });
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [showVideoDetails, setShowVideoDetails] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const req: GetVideosByUserIdRequest = {
        userId: Number(user.id),
        currentUserId: Number(user.id),
      };

      const res: GetVideosResponse = await videoClient.GetVideosByUserId(req, getAuthMetadata());

      if (res && res.videos) {
        // Separate published and draft videos
        // const published = res.videos.filter((video) => video.isPublished)
        // const drafts = res.videos.filter((video) => !video.isPublished)

        // setPublishedVideos(published)
        // setDraftVideos(drafts)
        setPublishedVideos(res.videos);
        setDraftVideos(res.videos);
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, getAuthMetadata]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchVideos();
    }
  }, [isAuthenticated, user?.id, fetchVideos]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    [],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch],
  );

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    const videos = activeTab === "published" ? publishedVideos : draftVideos;

    // Filter by search query
    const filtered = videos.filter(
      (video) =>
        video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.caption?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Sort videos
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortConfig.field) {
        case "likes":
          aValue = Number(a.likeCount) || 0;
          bValue = Number(b.likeCount) || 0;
          break;
        case "views":
          aValue = Number(a.viewsCount) || 0;
          bValue = Number(b.viewsCount) || 0;
          break;
        case "comments":
          aValue = Number(a.commentsCount) || 0;
          bValue = Number(b.commentsCount) || 0;
          break;
        case "date":
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
      }

      if (sortConfig.order === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [publishedVideos, draftVideos, activeTab, searchQuery, sortConfig]);

  // Handle sort change
  const handleSort = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
  }, []);

  // Handle video deletion
  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      if (
        !window.confirm("Are you sure you want to delete this video? This action cannot be undone.")
      ) {
        return;
      }

      setDeleteLoading(videoId);

      try {
        const req: DeleteVideoRequest = {
          id: Number(videoId),
        };

        await videoClient.DeleteVideo(req, getAuthMetadata());

        // Remove from local state
        setPublishedVideos((prev) => prev.filter((v) => String(v.id) !== videoId));
        setDraftVideos((prev) => prev.filter((v) => String(v.id) !== videoId));

        // Close details if this video was selected
        if (String(selectedVideo?.id) === String(videoId)) {
          setShowVideoDetails(false);
          setSelectedVideo(null);
        }
      } catch (err) {
        console.error("Failed to delete video:", err);
        alert("Failed to delete video. Please try again.");
      } finally {
        setDeleteLoading(null);
      }
    },
    [getAuthMetadata, selectedVideo?.id],
  );

  // Handle edit video
  const handleEditVideo = useCallback(
    (video: VideoType) => {
      navigate(`/edit-video/${video.id}`);
    },
    [navigate],
  );

  // Handle video details
  const handleShowDetails = useCallback((video: VideoType) => {
    setSelectedVideo(video);
    setShowVideoDetails(true);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          overflowY: "hidden",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
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
              width: "40px",
              height: "40px",
              border: "3px solid rgba(139, 92, 246, 0.3)",
              borderTop: "3px solid #8b5cf6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p>Loading your videos...</p>
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
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: "700",
              margin: "0 0 0.5rem 0",
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Manage Videos
          </h1>
          <p
            style={{
              color: "#8b949e",
              fontSize: "1rem",
              margin: "0",
            }}
          >
            Manage your published posts and drafts
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setActiveTab("published")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "12px",
                border: "none",
                background:
                  activeTab === "published"
                    ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                    : "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "published") {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "published") {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }
              }}
            >
              <Video size={16} />
              Published ({publishedVideos.length})
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "12px",
                border: "none",
                background:
                  activeTab === "draft"
                    ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                    : "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "draft") {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "draft") {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }
              }}
            >
              <FileText size={16} />
              Drafts ({draftVideos.length})
            </button>
          </div>

          {/* Search and Sort Controls */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <div
              style={{
                position: "relative",
                flex: "1",
                minWidth: "250px",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#8b949e",
                }}
              />
              <input
                type="text"
                placeholder="Search by description or caption..."
                onChange={handleSearchChange}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "all 0.3s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Sort Controls */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {[
                { field: "likes" as SortField, icon: Heart, label: "Likes" },
                { field: "views" as SortField, icon: Eye, label: "Views" },
                { field: "comments" as SortField, icon: MessageCircle, label: "Comments" },
                { field: "date" as SortField, icon: Calendar, label: "Date" },
              ].map(({ field, icon: Icon, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background:
                      sortConfig.field === field
                        ? "rgba(139, 92, 246, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                    color: sortConfig.field === field ? "#8b5cf6" : "#8b949e",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "0.8rem",
                    fontWeight: "500",
                  }}
                  onMouseEnter={(e) => {
                    if (sortConfig.field !== field) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.color = "#ffffff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sortConfig.field !== field) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.color = "#8b949e";
                    }
                  }}
                >
                  <Icon size={14} />
                  {label}
                  {sortConfig.field === field &&
                    (sortConfig.order === "asc" ? <SortAsc size={12} /> : <SortDesc size={12} />)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "1rem",
              marginBottom: "2rem",
              color: "#ef4444",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Videos Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {filteredAndSortedVideos.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px dashed rgba(255, 255, 255, 0.2)",
              }}
            >
              <Video size={48} style={{ color: "#8b949e", marginBottom: "1rem" }} />
              <h3 style={{ color: "#ffffff", marginBottom: "0.5rem" }}>
                No {activeTab} videos found
              </h3>
              <p style={{ color: "#8b949e", margin: "0" }}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : `You haven't ${activeTab === "published" ? "published" : "drafted"} any videos yet`}
              </p>
            </div>
          ) : (
            filteredAndSortedVideos.map((video) => (
              <div
                key={video.id}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.3)";
                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                }}
                onClick={() => handleShowDetails(video)}
              >
                {/* Video Thumbnail */}
                <div
                  style={{
                    height: "180px",
                    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {video.thumbnail && avatarBytesToUrl(video.thumbnail) ? (
                    <img
                      src={avatarBytesToUrl(video.thumbnail) || "/placeholder.svg"}
                      alt="Video thumbnail"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8b949e",
                      }}
                    >
                      <Video size={48} />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      //   background: video.isPublished ? "rgba(34, 197, 94, 0.9)" : "rgba(251, 191, 36, 0.9)",
                      background: "rgba(34, 197, 94, 0.9)",
                      color: "#ffffff",
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {/* {video.isPublished ? "Published" : "Draft"} */}
                    Published
                  </div>
                </div>

                {/* Video Info */}
                <div style={{ padding: "1rem" }}>
                  <h3
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      display: "-webkit-box",
                      WebkitLineClamp: "2",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: "1.4",
                    }}
                  >
                    {video.caption || "Untitled Video"}
                  </h3>

                  {video.description && (
                    <p
                      style={{
                        margin: "0 0 1rem 0",
                        fontSize: "0.8rem",
                        color: "#8b949e",
                        display: "-webkit-box",
                        WebkitLineClamp: "2",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: "1.4",
                      }}
                    >
                      {video.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                      fontSize: "0.8rem",
                      color: "#8b949e",
                    }}
                  >
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Heart size={12} />
                        {video.likeCount || 0}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Eye size={12} />
                        {video.viewsCount || 0}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MessageCircle size={12} />
                        {video.commentsCount || 0}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} />
                      {formatDate(
                        typeof video.createdAt === "string"
                          ? video.createdAt
                          : video.createdAt instanceof Date
                            ? video.createdAt.toISOString()
                            : undefined,
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVideo(video);
                      }}
                      style={{
                        flex: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        background: "rgba(139, 92, 246, 0.1)",
                        color: "#8b5cf6",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: "0.8rem",
                        fontWeight: "500",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
                        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
                      }}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVideo(String(video.id));
                      }}
                      disabled={deleteLoading === String(video.id)}
                      style={{
                        flex: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        cursor: deleteLoading === String(video.id) ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        fontSize: "0.8rem",
                        fontWeight: "500",
                        opacity: deleteLoading === String(video.id) ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (deleteLoading !== String(video.id)) {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (deleteLoading !== String(video.id)) {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                        }
                      }}
                    >
                      {deleteLoading === String(video.id) ? (
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid transparent",
                            borderTop: "2px solid currentColor",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Video Details Modal */}
        {showVideoDetails && selectedVideo && (
          <div
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(10px)",
              zIndex: "1000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setShowVideoDetails(false)}
          >
            <div
              style={{
                background: "rgba(26, 26, 26, 0.95)",
                borderRadius: "20px",
                padding: "2rem",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(20px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <h2
                  style={{
                    margin: "0",
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#ffffff",
                  }}
                >
                  Video Details
                </h2>
                <button
                  onClick={() => setShowVideoDetails(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px",
                    color: "#8b949e",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "#8b949e";
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Video Preview */}
              {selectedVideo.thumbnail && avatarBytesToUrl(selectedVideo.thumbnail) && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={avatarBytesToUrl(selectedVideo.thumbnail) || "/placeholder.svg"}
                    alt="Video thumbnail"
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}

              {/* Video Info */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#ffffff",
                  }}
                >
                  {selectedVideo.caption || "Untitled Video"}
                </h3>
                {selectedVideo.description && (
                  <p
                    style={{
                      margin: "0 0 1rem 0",
                      fontSize: "0.9rem",
                      color: "#8b949e",
                      lineHeight: "1.6",
                    }}
                  >
                    {selectedVideo.description}
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "1rem",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <Heart size={20} style={{ color: "#ef4444", marginBottom: "0.5rem" }} />
                  <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#ffffff" }}>
                    {selectedVideo.likeCount || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#8b949e" }}>Likes</div>
                </div>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "1rem",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <Eye size={20} style={{ color: "#3b82f6", marginBottom: "0.5rem" }} />
                  <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#ffffff" }}>
                    {selectedVideo.viewsCount || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#8b949e" }}>Views</div>
                </div>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "1rem",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <MessageCircle size={20} style={{ color: "#10b981", marginBottom: "0.5rem" }} />
                  <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#ffffff" }}>
                    {selectedVideo.commentsCount || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#8b949e" }}>Comments</div>
                </div>
              </div>

              {/* Meta Info */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "1rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#8b949e", fontSize: "0.8rem" }}>Status:</span>
                  <span
                    style={{
                      //   color: selectedVideo.isPublished ? "#22c55e" : "#f59e0b",
                      color: "#22c55e",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                    }}
                  >
                    {/* {selectedVideo.isPublished ? "Published" : "Draft"} */}
                    Published
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#8b949e", fontSize: "0.8rem" }}>Created:</span>
                  <span style={{ color: "#ffffff", fontSize: "0.8rem" }}>
                    {formatDate(
                      typeof selectedVideo.createdAt === "string"
                        ? selectedVideo.createdAt
                        : selectedVideo.createdAt instanceof Date
                          ? selectedVideo.createdAt.toISOString()
                          : undefined,
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                }}
              >
                <button
                  onClick={() => {
                    setShowVideoDetails(false);
                    handleEditVideo(selectedVideo);
                  }}
                  style={{
                    flex: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Edit size={16} />
                  Edit Video
                </button>
                <button
                  onClick={() => {
                    setShowVideoDetails(false);
                    handleDeleteVideo(String(selectedVideo.id));
                  }}
                  style={{
                    flex: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Trash2 size={16} />
                  Delete Video
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

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .controls-container {
            flex-direction: column;
            align-items: stretch;
          }
          
          .sort-controls {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .video-grid {
            grid-template-columns: 1fr;
          }
          
          .tabs-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageVideosPage;
