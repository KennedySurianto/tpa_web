import type React from "react"
import { Link, useNavigate } from "react-router-dom"
import type { Video } from "../api/gen/video"
import { avatarBytesToUrl } from "../utils/avatarConverter"
import { Upload, Play, Eye, Heart, MessageCircle, VideoIcon } from "lucide-react"

interface VideoGridProps {
  videos: Video[]
  isOwnProfile: boolean
  isVideoTab: boolean
}

const VideoTab: React.FC<VideoGridProps> = ({ videos, isOwnProfile, isVideoTab }) => {
  const navigate = useNavigate();

  return (
    <div className="video-container">
      {/* Upload Video Card - Always Displayed as First Grid Item */}
      {isOwnProfile && isVideoTab && (
        <div className="video-card upload-card">
          <Link to="/upload" className="upload-link">
            <div className="upload-content">
              <div className="upload-icon">
                <Upload size={32} />
              </div>
              <div className="upload-text">
                <h3>Upload Video</h3>
                <p>Share your content</p>
              </div>
            </div>
            <div className="upload-overlay">
              <VideoIcon size={20} />
            </div>
          </Link>
        </div>
      )}

      {/* Empty State */}
      {videos.length === 0 && (
        <div className="video-card empty-card">
          <div className="empty-content">
            <div className="empty-icon">
              <VideoIcon size={32} />
            </div>
            <div className="empty-text">
              <h3>No Videos Yet</h3>
              <p>{isOwnProfile ? "Upload your first video" : "User hasn't posted any videos"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Display Video Cards */}
      {videos.map((video) => (
        <div
          key={video.id}
          className="video-card"
          onClick={() => navigate(`/video/${video.id}`)}
        >
          <div className="video-thumbnail">
            {video.thumbnail.length !== 0 ? (
              <img
          src={avatarBytesToUrl(video.thumbnail) || "/placeholder.svg?height=200&width=150"}
          alt={`Thumbnail ${video.id}`}
          className="thumbnail-image"
              />
            ) : (
              <video
          className="thumbnail-video"
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            ;(e.target as HTMLVideoElement).currentTime = 0
          }}
              >
          <source src={video.videoUrl} type="video/mp4" />
              </video>
            )}
          </div>

          <div className="video-stats">
            <div className="stat-item">
              <Eye size={12} />
              <span>{video.viewsCount}</span>
            </div>
            <div className="stat-item">
              <Heart size={12} className={video.isLiked ? "liked" : ""} />
              <span>{video.likeCount}</span>
            </div>
            <div className="stat-item">
              <MessageCircle size={12} />
              <span>{video.commentsCount}</span>
            </div>
          </div>

          <div className="video-overlay">
            <div className="play-button">
              <Play size={16} fill="currentColor" />
            </div>
          </div>
        </div>
      ))}

      <style>{`
        .video-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
          padding-bottom: 2rem;
        }

        .video-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          aspect-ratio: 3 / 4;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .video-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.2);
        }

        /* Upload Video Card */
        .upload-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .upload-card:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15));
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
        }

        .upload-link {
          text-decoration: none;
          color: inherit;
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          height: 100%;
          text-align: center;
        }

        .upload-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          color: #8b5cf6;
          flex-shrink: 0;
        }

        .upload-text h3 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .upload-text p {
          margin: 0;
          font-size: 0.8rem;
          color: #8b949e;
        }

        .upload-overlay {
          position: absolute;
          top: 12px;
          right: 12px;
          color: rgba(139, 92, 246, 0.8);
        }

        /* Empty State Card */
        .empty-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          grid-column: 1 / -1;
          aspect-ratio: 16 / 9;
          max-width: 400px;
          margin: 0 auto;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 24px;
          height: 100%;
          text-align: center;
        }

        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .empty-text h3 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .empty-text p {
          margin: 0;
          font-size: 0.9rem;
          color: #8b949e;
        }

        /* Video Cards */
        .video-thumbnail {
          height: 75%;
          background: #000;
          position: relative;
        }

        .thumbnail-image,
        .thumbnail-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-stats {
          position: absolute;
          bottom: 8px;
          left: 8px;
          right: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          padding: 6px 8px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .stat-item .liked {
          color: #ef4444;
          fill: #ef4444;
        }

        .video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .video-card:hover .video-overlay {
          opacity: 1;
        }

        .play-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          border-radius: 50%;
          color: white;
          transition: transform 0.2s ease;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
        }

        .play-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(139, 92, 246, 0.4);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .video-container {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }

          .upload-content {
            padding: 20px 12px;
            gap: 10px;
          }

          .upload-icon {
            width: 40px;
            height: 40px;
          }

          .upload-text h3 {
            font-size: 0.9rem;
          }

          .upload-text p {
            font-size: 0.75rem;
          }

          .empty-content {
            padding: 20px;
            gap: 12px;
          }

          .empty-icon {
            width: 50px;
            height: 50px;
          }

          .empty-text h3 {
            font-size: 1rem;
          }

          .empty-text p {
            font-size: 0.8rem;
          }

          .video-stats {
            padding: 4px 6px;
          }

          .stat-item {
            font-size: 0.65rem;
          }

          .play-button {
            width: 36px;
            height: 36px;
          }
        }

        @media (max-width: 480px) {
          .video-container {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
          }

          .upload-content {
            padding: 16px 8px;
          }

          .upload-icon {
            width: 36px;
            height: 36px;
          }

          .upload-text h3 {
            font-size: 0.8rem;
          }

          .upload-text p {
            font-size: 0.7rem;
          }

          .empty-card {
            aspect-ratio: 4 / 3;
          }

          .video-stats {
            flex-direction: column;
            gap: 2px;
            padding: 4px;
          }

          .stat-item {
            font-size: 0.6rem;
          }
        }
      `}</style>
    </div>
  )
}

export default VideoTab
