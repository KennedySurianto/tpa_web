import type React from "react";
import { useEffect, useState } from "react";
import type { GetPlaylistRequest, Playlist } from "../api/gen/playlist";
import { avatarBytesToUrl } from "../utils/avatarConverter";
import { playlistClient } from "../api/grpc/playlistClient";
import type { GetPlaylistByUserIdResponse } from "../api/gen/playlist";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthProvider";
import { Plus, Music, Settings, Play } from "lucide-react";

interface PlaylistTabProps {
  userId: string;
  isOwnProfile: boolean;
}

const PlaylistTab: React.FC<PlaylistTabProps> = ({ userId, isOwnProfile }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      const req: GetPlaylistRequest = {
        id: userId,
        currentUserId: user?.id?.toString() ?? "0",
      };

      try {
        const res: GetPlaylistByUserIdResponse = await playlistClient.GetPlaylistsByUserId(req);
        setPlaylists(res.playlists);
        console.log("fetched playlists: ", res.playlists);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      }
    };

    fetchPlaylists();
  }, [userId]);

  return (
    <div className="playlist-container">
      {/* Manage Playlist Card - First Grid Item */}
      {isOwnProfile && (
        <div className="playlist-card manage-card" onClick={() => navigate("/playlist")}>
          <div className="manage-content">
            <div className="manage-icon">
              <Plus size={32} />
            </div>
            <div className="manage-text">
              <h3>Manage Playlists</h3>
              <p>Create and organize your playlists</p>
            </div>
          </div>
          <div className="manage-overlay">
            <Settings size={20} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {playlists.length === 0 && (
        <div className="playlist-card empty-card">
          <div className="empty-content">
            <div className="empty-icon">
              <Music size={32} />
            </div>
            <div className="empty-text">
              <h3>No Playlists Yet</h3>
              <p>
                {isOwnProfile ? "Create your first playlist" : "User hasn't created any playlists"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Playlists Grid */}
      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className="playlist-card"
          onClick={() => alert(`Open playlist: ${playlist.name}`)}
        >
          <div className="playlist-thumbnails">
            {playlist.videos.slice(0, 3).map((video, index) => (
              <div key={index} className="thumbnail-wrapper">
                {video.thumbnail.length !== 0 ? (
                  <img
                    src={avatarBytesToUrl(video.thumbnail) || "/placeholder.svg?height=80&width=80"}
                    alt={`Thumbnail ${index + 1}`}
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
                      (e.target as HTMLVideoElement).currentTime = 0;
                    }}
                  >
                    <source src={video.videoUrl} type="video/mp4" />
                  </video>
                )}
              </div>
            ))}
            {playlist.videos.length < 3 &&
              Array.from({ length: 3 - playlist.videos.length }).map((_, index) => (
                <div key={`empty-${index}`} className="thumbnail-wrapper empty-thumbnail">
                  <Music size={20} />
                </div>
              ))}
          </div>

          <div className="playlist-info">
            <div className="playlist-header">
              <h3 className="playlist-name">{playlist.name}</h3>
              <div className="playlist-count">
                <Play size={14} />
                <span>{playlist.videos.length}</span>
              </div>
            </div>
          </div>

          <div className="playlist-overlay">
            <div className="play-button">
              <Play size={16} fill="currentColor" />
            </div>
          </div>
        </div>
      ))}

      <style>{`
        .playlist-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          padding-bottom: 2rem;
        }

        .playlist-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          aspect-ratio: 16 / 9;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .playlist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.2);
        }

        /* Manage Playlist Card */
        .manage-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .manage-card:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15));
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
        }

        .manage-content {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          height: 100%;
        }

        .manage-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          color: #8b5cf6;
          flex-shrink: 0;
        }

        .manage-text h3 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .manage-text p {
          margin: 0;
          font-size: 0.9rem;
          color: #8b949e;
        }

        .manage-overlay {
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

        /* Playlist Cards */
        .playlist-thumbnails {
          display: flex;
          height: 60%;
          background: #000;
        }

        .thumbnail-wrapper {
          flex: 1;
          position: relative;
          margin-right: 2px;
        }

        .thumbnail-wrapper:last-child {
          margin-right: 0;
        }

        .thumbnail-image,
        .thumbnail-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .empty-thumbnail {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          color: #8b949e;
        }

        .playlist-info {
          padding: 12px 16px;
          height: 40%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .playlist-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .playlist-name {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          margin-right: 8px;
        }

        .playlist-count {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #3b82f6;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .playlist-description {
          margin: 0;
          font-size: 0.8rem;
          color: #8b949e;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .playlist-overlay {
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

        .playlist-card:hover .playlist-overlay {
          opacity: 1;
        }

        .play-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
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
          .playlist-container {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 12px;
          }

          .manage-content {
            padding: 20px;
            gap: 12px;
          }

          .manage-icon {
            width: 50px;
            height: 50px;
          }

          .manage-text h3 {
            font-size: 1rem;
          }

          .manage-text p {
            font-size: 0.8rem;
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

          .playlist-info {
            padding: 10px 12px;
          }

          .playlist-name {
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .playlist-container {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .manage-content {
            flex-direction: column;
            text-align: center;
            padding: 24px 16px;
          }

          .manage-text {
            text-align: center;
          }

          .empty-content {
            padding: 24px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default PlaylistTab;
