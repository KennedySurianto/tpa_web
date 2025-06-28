import React from "react";
import type { Video } from "../api/gen/video";
import defaultAvatar from "../assets/default.jpg";
import { avatarBytesToUrl } from "../utils/avatarConverter";

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const user = video.user;
  const thumbnailUrl = avatarBytesToUrl(video.thumbnail);
  const formattedTime = video.createdAt
    ? new Date(video.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  return (
    <div
      onClick={onClick}
      style={{
        width: "160px",
        background: "#1f1f1f",
        borderRadius: "10px",
        overflow: "hidden",
        color: "white",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        paddingBottom: "8px",
      }}
    >
      {/* Thumbnail or Video Preview */}
      <div style={{ width: "100%", height: "230px", position: "relative" }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="video thumbnail"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
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
            }}
          />
        )}
      </div>

      {/* Info section */}
      <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* Caption */}
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
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
              color: "#ccc",
              lineHeight: "1.2",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
            title={video.description}
          >
            {video.description}
          </div>
        )}

        {/* User Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <img
            src={avatarBytesToUrl(user?.avatar) || defaultAvatar}
            alt={user?.username}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.8rem" }}>@{user?.username}</div>
            <div style={{ fontSize: "0.7rem", color: "#aaa" }}>{formattedTime}</div>
          </div>
        </div>

        {/* Likes */}
        <div style={{ fontSize: "0.8rem", color: "#ff6b35", fontWeight: "bold", textAlign: "right" }}>
          ❤️ {video.likeCount}
        </div>
      </div>
    </div>
  );
};
