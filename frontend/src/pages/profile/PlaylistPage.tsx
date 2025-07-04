import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../utils/AuthProvider";
import type {
  CreatePlaylistRequest,
  CreatePlaylistResponse,
  DeletePlaylistRequest,
  DeletePlaylistResponse,
  GetPlaylistByUserIdResponse,
  GetPlaylistRequest,
  Playlist,
  UpdatePlaylistRequest,
  UpdatePlaylistResponse,
} from "../../api/gen/playlist";
import { playlistClient } from "../../api/grpc/playlistClient";
import { videoClient } from "../../api/grpc/videoClient";
import { useNavigate } from "react-router-dom";
import { avatarBytesToUrl } from "../../utils/avatarConverter";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Play,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  GripVertical,
  X,
  Check,
  Search,
  VideoIcon,
  List,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { Video } from "../../api/gen/video";

const PlaylistPage: React.FC = () => {
  const { user, getAuthMetadata } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSelected, setCreateSelected] = useState<Video[]>([]);
  const [editName, setEditName] = useState("");
  const [editSelected, setEditSelected] = useState<Video[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setLoading(true);

      const req: GetPlaylistRequest = {
        id: user?.id.toString(),
        currentUserId: user?.id.toString(),
      };

      try {
        const res: GetPlaylistByUserIdResponse = await playlistClient.GetPlaylistsByUserId(req);
        setPlaylists(res.playlists);
        console.log("fetched playlists: ", res.playlists);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
        setErrorMessage("Failed to fetch playlists. Please try again later.");
      }

      try {
        const userVideosRes = await videoClient.GetVideosByUserId({
          userId: Number(user.id),
          currentUserId: Number(user.id),
        });
        setAllVideos(
          userVideosRes.videos.filter(
            (video) => video.isPublished && String(video.privacy.toLocaleLowerCase()) === "public",
          ),
        );
        console.log(
          "fetched videos: ",
          userVideosRes.videos.filter(
            (video) => video.isPublished && String(video.privacy.toLocaleLowerCase()) === "public",
          ),
        );
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setErrorMessage("Failed to fetch videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const openEdit = (p: Playlist) => {
    setSelectedPlaylist(p);
    setEditName(p.name);
    setEditSelected([...p.videos]);
  };

  const saveEdit = async () => {
    if (!selectedPlaylist) return;

    const updatedPlaylist: UpdatePlaylistRequest = {
      id: selectedPlaylist.id,
      name: editName,
      videoIds: editSelected.map((v) => v.id.toString()),
    };

    try {
      const res: UpdatePlaylistResponse = await playlistClient.UpdatePlaylist(
        updatedPlaylist,
        getAuthMetadata(),
      );
      if (res && res.playlistId) {
        const updated = playlists.map((p) =>
          p.id === selectedPlaylist.id ? { ...p, name: editName, videos: editSelected } : p,
        );
        setPlaylists(updated);
        setSelectedPlaylist(null);
        setEditName("");
        setEditSelected([]);
      }
    } catch (error) {
      console.error("Failed to update playlist:", error);
      setErrorMessage("Failed to update playlist. Please try again later.");
    }
  };

  const createPlaylist = async () => {
    if (!user?.id) return;

    if (!createName || createSelected.length === 0) {
      setErrorMessage("Playlist name and at least one video are required");
      return;
    }

    const req: CreatePlaylistRequest = {
      name: createName,
      userId: user?.id ?? "0",
      videoIds: createSelected.map((v) => v.id.toString()),
    };

    try {
      const res: CreatePlaylistResponse = await playlistClient.CreatePlaylist(
        req,
        getAuthMetadata(),
      );
      if (res && res.playlistId) {
        const newPlaylist = {
          id: res.playlistId,
          name: createName,
          userId: user?.id ?? "0",
          videos: createSelected,
        };
        setPlaylists((prev) => [...prev, newPlaylist]);
        setIsCreateModalOpen(false);
        setCreateName("");
        setCreateSelected([]);
      }
    } catch (error) {
      console.error("Failed to create playlist:", error);
      setErrorMessage("Failed to create playlist. Please try again later.");
    }
  };

  const deletePlaylist = async () => {
    if (!playlistToDelete?.id) return;

    const req: DeletePlaylistRequest = {
      id: playlistToDelete.id,
    };

    try {
      const res: DeletePlaylistResponse = await playlistClient.DeletePlaylist(
        req,
        getAuthMetadata(),
      );

      if (res && res.success) {
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistToDelete.id));
        setIsDeleteConfirmOpen(false);
        setPlaylistToDelete(null);
        console.log("Playlist deleted:", playlistToDelete);
      }
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      setErrorMessage("Failed to delete playlist. Please try again later.");
    }
  };

  const toggleVideoSelection = (video: Video, isEditMode = false) => {
    const currentSelected = isEditMode ? editSelected : createSelected;
    const setCurrentSelected = isEditMode ? setEditSelected : setCreateSelected;
    const isSelected = currentSelected.some((v) => v.id === video.id);

    if (isSelected) {
      setCurrentSelected((prev) => prev.filter((v) => v.id !== video.id));
    } else {
      setCurrentSelected((prev) => [...prev, video]);
    }
  };

  const filteredVideos = allVideos.filter(
    (video) =>
      video.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const renderVideoSelectionModal = (
    title: string,
    name: string,
    setName: (name: string) => void,
    selectedVideos: Video[],
    onSave: () => void,
    onCancel: () => void,
    isEditMode = false,
  ) => (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onCancel} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <div className="input-group">
              <label className="input-label">Playlist Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter playlist name"
                className="text-input"
              />
            </div>
          </div>

          <div className="video-selection-section">
            <div className="available-videos-panel">
              <div className="panel-header">
                <VideoIcon size={18} />
                <h3>Available Videos ({filteredVideos.length})</h3>
              </div>

              <div className="search-container">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="video-grid">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`video-card ${selectedVideos.some((v) => v.id === video.id) ? "selected" : ""}`}
                    onClick={() => toggleVideoSelection(video, isEditMode)}
                  >
                    <div className="video-thumbnail">
                      {video.thumbnail && video.thumbnail.length > 0 ? (
                        <img
                          src={
                            avatarBytesToUrl(video.thumbnail) ||
                            "/placeholder.svg?height=120&width=200"
                          }
                          alt={video.caption}
                          className="thumbnail-image"
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <VideoIcon size={24} />
                        </div>
                      )}
                      <div className="video-overlay">
                        <Play size={16} />
                      </div>
                      <div className="video-duration">{formatDuration(video.duration || 0)}</div>
                    </div>

                    <div className="video-info">
                      <h4 className="video-title">{video.caption}</h4>
                      <div className="video-stats">
                        <span className="stat-item">
                          <Eye size={12} />
                          {formatViews(Number(video.viewsCount))}
                        </span>
                        <span className="stat-item">
                          <Heart size={12} />
                          {video.likeCount}
                        </span>
                        <span className="stat-item">
                          <MessageCircle size={12} />
                          {video.commentsCount}
                        </span>
                      </div>
                    </div>

                    <div className="selection-indicator">
                      {selectedVideos.some((v) => v.id === video.id) && (
                        <div className="selected-badge">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="selected-videos-panel">
              <div className="panel-header">
                <List size={18} />
                <h3>Selected Videos ({selectedVideos.length})</h3>
              </div>

              {selectedVideos.length > 0 ? (
                <div className="selected-list">
                  {selectedVideos.map((video, index) => (
                    <div
                      key={video.id}
                      className="selected-item"
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedIndex === null || draggedIndex === index) return;
                        const reordered = [...selectedVideos];
                        const [dragged] = reordered.splice(draggedIndex, 1);
                        reordered.splice(index, 0, dragged);
                        const setList = isEditMode ? setEditSelected : setCreateSelected;
                        setList(reordered);
                        setDraggedIndex(null);
                      }}
                    >
                      <div className="drag-handle">
                        <GripVertical size={16} />
                      </div>

                      <div className="item-thumbnail">
                        {video.thumbnail && video.thumbnail.length > 0 ? (
                          <img
                            src={
                              avatarBytesToUrl(video.thumbnail) ||
                              "/placeholder.svg?height=40&width=60"
                            }
                            alt={video.caption}
                            className="mini-thumbnail"
                          />
                        ) : (
                          <div className="mini-placeholder">
                            <VideoIcon size={16} />
                          </div>
                        )}
                      </div>

                      <div className="item-info">
                        <span className="item-number">{index + 1}.</span>
                        <span className="item-title">{video.caption}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVideoSelection(video, isEditMode);
                        }}
                        className="remove-button"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <VideoIcon size={32} />
                  <p>No videos selected</p>
                  <span>Select videos from the left panel</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button
            onClick={onSave}
            className="save-button"
            disabled={!name || selectedVideos.length === 0}
          >
            {isEditMode ? "Save Changes" : "Create Playlist"}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 size={32} className="loading-spinner" />
        <p>Loading playlists...</p>
      </div>
    );
  }

  return (
    <div className="playlist-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="header-content">
          <h1 className="page-title">My Playlists</h1>
          <p className="page-subtitle">{playlists.length} playlists</p>
        </div>
        <button className="create-button" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={20} />
          Create Playlist
        </button>
      </div>

      {errorMessage && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="error-close">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="playlists-grid">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-card">
            <div className="playlist-thumbnails">
              {playlist.videos.slice(0, 4).map((video, index) => (
                <div key={index} className="thumbnail-slot">
                  {video.thumbnail && video.thumbnail.length > 0 ? (
                    <img
                      src={
                        avatarBytesToUrl(video.thumbnail) || "/placeholder.svg?height=80&width=80"
                      }
                      alt={`Video ${index + 1}`}
                      className="playlist-thumbnail"
                    />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <VideoIcon size={20} />
                    </div>
                  )}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 4 - playlist.videos.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="thumbnail-slot empty">
                  <VideoIcon size={20} />
                </div>
              ))}
            </div>

            <div className="playlist-info">
              <h3 className="playlist-name">{playlist.name}</h3>
              <div className="playlist-stats">
                <span className="stat">
                  <VideoIcon size={14} />
                  {playlist.videos.length} videos
                </span>
                <span className="stat">
                  <Clock size={14} />
                  {Math.floor(
                    playlist.videos.reduce((acc, video) => acc + (video.duration || 0), 0) / 60,
                  )}{" "}
                  min
                </span>
              </div>
            </div>

            <div className="playlist-actions">
              <button onClick={() => openEdit(playlist)} className="action-button edit">
                <Edit3 size={16} />
                Edit
              </button>
              <button
                onClick={() => {
                  setPlaylistToDelete(playlist);
                  setIsDeleteConfirmOpen(true);
                }}
                className="action-button delete"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}

        {playlists.length === 0 && (
          <div className="empty-playlists">
            <List size={48} />
            <h3>No playlists yet</h3>
            <p>Create your first playlist to organize your videos</p>
            <button className="create-button" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={20} />
              Create Playlist
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen &&
        renderVideoSelectionModal(
          "Create New Playlist",
          createName,
          setCreateName,
          createSelected,
          createPlaylist,
          () => {
            setIsCreateModalOpen(false);
            setCreateName("");
            setCreateSelected([]);
            setSearchQuery("");
          },
        )}

      {/* Edit Modal */}
      {selectedPlaylist &&
        renderVideoSelectionModal(
          "Edit Playlist",
          editName,
          setEditName,
          editSelected,
          saveEdit,
          () => {
            setSelectedPlaylist(null);
            setEditName("");
            setEditSelected([]);
            setSearchQuery("");
          },
          true,
        )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && playlistToDelete && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <div className="modal-header">
              <h2 className="modal-title">Delete Playlist</h2>
            </div>
            <div className="modal-body">
              <div className="delete-content">
                <Trash2 size={48} className="delete-icon" />
                <p>
                  Are you sure you want to delete <strong>"{playlistToDelete.name}"</strong>?
                </p>
                <span>This action cannot be undone.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setPlaylistToDelete(null);
                }}
                className="cancel-button"
              >
                Cancel
              </button>
              <button onClick={deletePlaylist} className="delete-confirm-button">
                <Trash2 size={16} />
                Delete Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .playlist-page {
          height: 100vh;
          overflow-y: auto;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 2rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #ffffff;
          gap: 1rem;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          color: #8b5cf6;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .header-content {
          flex: 1;
          text-align: center;
        }

        .page-title {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          margin: 0.25rem 0 0 0;
          color: #8b949e;
          font-size: 0.9rem;
        }

        .create-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          border: none;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .create-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
        }

        .create-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .error-close {
          margin-left: auto;
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .error-close:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .playlist-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .playlist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .playlist-thumbnails {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 160px;
          background: #000;
        }

        .thumbnail-slot {
          position: relative;
          overflow: hidden;
        }

        .thumbnail-slot.empty {
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b949e;
        }

        .playlist-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b949e;
        }

        .playlist-info {
          padding: 1.5rem;
        }

        .playlist-name {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
        }

        .playlist-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #8b949e;
          font-size: 0.8rem;
        }

        .playlist-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0 1.5rem 1.5rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.8rem;
          font-weight: 500;
          border: none;
        }

        .action-button.edit {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .action-button.edit:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .action-button.delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .action-button.delete:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .empty-playlists {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          color: #8b949e;
        }

        .empty-playlists h3 {
          margin: 1rem 0 0.5rem 0;
          color: #ffffff;
          font-size: 1.5rem;
        }

        .empty-playlists p {
          margin: 0 0 2rem 0;
          font-size: 1rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-container {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border-radius: 16px;
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-container.delete-modal {
          max-width: 400px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #8b949e;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .input-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .text-input, .textarea-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .text-input:focus, .textarea-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .textarea-input {
          resize: vertical;
          min-height: 80px;
        }

        .video-selection-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          height: 500px;
        }

        .available-videos-panel, .selected-videos-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .search-container {
          position: relative;
          margin: 1rem;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8b949e;
        }

        .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.8rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #8b5cf6;
        }

        .video-grid {
          flex: 1;
          overflow-y: auto;
          padding: 0 1rem 1rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .video-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .video-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .video-card.selected {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        .video-thumbnail {
          position: relative;
          aspect-ratio: 16/9;
          background: #000;
        }

        .thumbnail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .video-card:hover .video-overlay {
          opacity: 1;
        }

        .video-duration {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          background: rgba(0, 0, 0, 0.8);
          color: #ffffff;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .video-info {
          padding: 0.75rem;
        }

        .video-title {
          margin: 0 0 0.5rem 0;
          font-size: 0.8rem;
          font-weight: 500;
          color: #ffffff;
          line-height: 1.3;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .video-stats {
          display: flex;
          gap: 0.75rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #8b949e;
          font-size: 0.7rem;
        }

        .selection-indicator {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
        }

        .selected-badge {
          background: #8b5cf6;
          color: #ffffff;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .selected-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .selected-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          margin-bottom: 0.5rem;
          cursor: grab;
          transition: all 0.2s ease;
        }

        .selected-item:active {
          cursor: grabbing;
        }

        .selected-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .drag-handle {
          color: #8b949e;
          cursor: grab;
        }

        .item-thumbnail {
          width: 40px;
          height: 24px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .mini-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mini-placeholder {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b949e;
        }

        .item-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }

        .item-number {
          color: #8b949e;
          font-size: 0.8rem;
          font-weight: 500;
          flex-shrink: 0;
        }

        .item-title {
          color: #ffffff;
          font-size: 0.8rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remove-button {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-radius: 4px;
          padding: 0.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .remove-button:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #8b949e;
          padding: 2rem;
        }

        .empty-state p {
          margin: 1rem 0 0.5rem 0;
          color: #ffffff;
          font-size: 1rem;
        }

        .empty-state span {
          font-size: 0.8rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cancel-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .cancel-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .save-button {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          border: none;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .save-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .delete-content {
          text-align: center;
          padding: 1rem;
        }

        .delete-icon {
          color: #ef4444;
          margin-bottom: 1rem;
        }

        .delete-content p {
          margin: 0 0 0.5rem 0;
          color: #ffffff;
          font-size: 1rem;
        }

        .delete-content span {
          color: #8b949e;
          font-size: 0.9rem;
        }

        .delete-confirm-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ef4444;
          border: none;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .delete-confirm-button:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .playlist-page {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-content {
            text-align: left;
          }

          .playlists-grid {
            grid-template-columns: 1fr;
          }

          .video-selection-section {
            grid-template-columns: 1fr;
            height: auto;
          }

          .available-videos-panel {
            order: 1;
          }

          .selected-videos-panel {
            order: 2;
            max-height: 300px;
          }

          .video-grid {
            grid-template-columns: 1fr;
          }

          .modal-container {
            margin: 0.5rem;
            max-height: 95vh;
          }
        }
      `}</style>
    </div>
  );
};

export default PlaylistPage;
