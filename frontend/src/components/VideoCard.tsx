import type React from "react";
import { Heart, User, Calendar } from "lucide-react";
import type { Video } from "../api/gen/video";
import defaultAvatar from "../assets/default.jpg";
import { avatarBytesToUrl } from "../utils/avatarConverter";
import { useNavigate } from "react-router-dom";

interface VideoCardProps {
  video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const user = video.user;
  const thumbnailUrl = avatarBytesToUrl(video.thumbnail);
  const navigate = useNavigate();

  const formattedTime = video.createdAt
    ? new Date(video.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  return (
    <div
      onClick={() => navigate(`/video/${video.id}`)}
      style={{
        width: "200px",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        overflow: "hidden",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        maxHeight: "400px",
        overflowY: "auto",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
        e.currentTarget.style.boxShadow =
          "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.2)";
        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
      }}
    >
      {/* Thumbnail or Video Preview */}
      <div
        style={{
          width: "100%",
          height: "200px",
          position: "relative",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          overflow: "hidden",
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl || "/placeholder.svg"}
            alt="video thumbnail"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
        ) : (
          <video
            src={video.videoUrl}
            muted
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
        )}

        {/* Gradient overlay for better text readability */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "60px",
            background: "linear-gradient(transparent, rgba(0, 0, 0, 0.8))",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Info section */}
      <div
        style={{
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flex: "1",
          minHeight: "0",
        }}
      >
        {/* Caption */}
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: "600",
            lineHeight: "1.3",
            color: "#ffffff",
            display: "-webkit-box",
            WebkitLineClamp: "2",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
          }}
          title={video.caption}
        >
          {video.caption}
        </div>

        {/* Description */}
        {video.description && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#8b949e",
              lineHeight: "1.4",
              display: "-webkit-box",
              WebkitLineClamp: "2",
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: "break-word",
            }}
            title={video.description}
          >
            {video.description}
          </div>
        )}

        {/* User Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 0",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            marginTop: "auto",
          }}
        >
          <div
            style={{
              position: "relative",
              flexShrink: "0",
            }}
          >
            <img
              src={avatarBytesToUrl(user?.avatar) || defaultAvatar}
              alt={user?.username}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "12px",
                height: "12px",
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                borderRadius: "50%",
                border: "2px solid #0a0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={6} color="white" />
            </div>
          </div>

          <div style={{ flex: "1", minWidth: "0" }}>
            <div
              style={{
                fontWeight: "600",
                fontSize: "0.8rem",
                color: "#ffffff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              @{user?.username}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#8b949e",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "2px",
              }}
            >
              <Calendar size={10} />
              {formattedTime}
            </div>
          </div>
        </div>

        {/* Likes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginTop: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.8rem",
              fontWeight: "600",
              color: "#ffffff",
            }}
          >
            <Heart
              size={14}
              style={{
                color: video.isLiked ? "#ef4444" : "#8b949e",
                fill: video.isLiked ? "#ef4444" : "none",
                transition: "all 0.2s ease",
              }}
            />
            <span>{video.likeCount}</span>
          </div>

          <div
            style={{
              fontSize: "0.7rem",
              color: "#8b949e",
              background: "rgba(139, 92, 246, 0.1)",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            {video.viewsCount || 0} views
          </div>
        </div>
      </div>

      {/* Hover overlay effect */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))",
          opacity: "0",
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
          borderRadius: "16px",
        }}
        className="hover-overlay"
      />

      <style>{`
        .video-card:hover .hover-overlay {
          opacity: 1;
        }
        
        /* Custom scrollbar for the card */
        .video-card::-webkit-scrollbar {
          width: 4px;
        }
        
        .video-card::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        
        .video-card::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 2px;
        }
        
        .video-card::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
};
