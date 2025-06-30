import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "../../utils/AuthProvider"
import type { CreatePlaylistRequest, CreatePlaylistResponse, GetPlaylistByUserIdResponse, GetPlaylistRequest, Playlist, UpdatePlaylistRequest, UpdatePlaylistResponse, Video } from "../../api/gen/playlist"
import { playlistClient } from "../../api/grpc/playlistClient"
import { videoClient } from "../../api/grpc/videoClient"
import { useNavigate } from "react-router-dom"

const PlaylistPage: React.FC = () => {
    const { user } = useAuth()
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [allVideos, setAllVideos] = useState<Video[]>([])
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createName, setCreateName] = useState("")
    const [createSelected, setCreateSelected] = useState<Video[]>([])
    const [editName, setEditName] = useState("")
    const [editSelected, setEditSelected] = useState<Video[]>([])
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;

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
                const userVideosRes = await videoClient.GetVideosByUserId({ userId: Number(user.id) });
                setAllVideos(userVideosRes.videos);
                console.log("fetched videos: ", userVideosRes.videos);
            } catch (error) {
                console.error("Failed to fetch videos:", error);
                setErrorMessage("Failed to fetch videos. Please try again later.");
            }
        };

        fetchData();
    }, [user]);

    const openEdit = (p: Playlist) => {
        setSelectedPlaylist(p)
        setEditName(p.name)
        setEditSelected([...p.videos]) // Create a copy to avoid mutations
    }

    const saveEdit = async () => {
        if (!selectedPlaylist) return;

        const updatedPlaylist: UpdatePlaylistRequest = {
            id: selectedPlaylist.id,
            name: editName,
            videoIds: editSelected.map((v) => v.id.toString()), // Ensure order is preserved
        };

        try {
            const res: UpdatePlaylistResponse = await playlistClient.UpdatePlaylist(updatedPlaylist);
            if (res && res.playlistId) {
                const updated = playlists.map((p) =>
                    p.id === selectedPlaylist.id ? { ...p, name: editName, videos: editSelected } : p
                );
                setPlaylists(updated);
                setSelectedPlaylist(null);
            }
        } catch (error) {
            console.error("Failed to update playlist:", error);
            setErrorMessage("Failed to update playlist. Please try again later.");
        }
    };

    const createPlaylist = async () => {
        if (!user?.id) return;

        if (!createName || createSelected.length === 0) {
            console.error("Playlist name and videos are required");
            return;
        }

        const req: CreatePlaylistRequest = {
            name: createName,
            userId: user?.id ?? "0",
            videoIds: createSelected.map((v) => v.id.toString()), // Ensure order is preserved
        };

        try {
            const res: CreatePlaylistResponse = await playlistClient.CreatePlaylist(req);
            if (res && res.playlistId) {
                const newPlaylist = {
                    id: res.playlistId,
                    name: createName,
                    userId: user?.id ?? "0",
                    videos: createSelected, // Using the video order
                };
                setPlaylists((prev) => [...prev, newPlaylist]);
                setIsCreateModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to create playlist:", error);
            setErrorMessage("Failed to create playlist. Please try again later.");
        }
    };

    const deletePlaylist = async () => {
        if (!playlistToDelete?.id) return;
        
        try {
            await playlistClient.DeletePlaylist({ id: playlistToDelete.id });
            // After deletion, remove the playlist from state
            setPlaylists((prev) => prev.filter((p) => p.id !== playlistToDelete.id));
            setIsDeleteConfirmOpen(false); // Close the confirm dialog
            setPlaylistToDelete(null); // Reset the playlist to delete
            console.log("Playlist deleted:", playlistToDelete);
        } catch (error) {
            console.error("Failed to delete playlist:", error);
            setErrorMessage("Failed to delete playlist. Please try again later.");
        }
    };

    const toggleVideoSelection = (video: Video, isEditMode = false) => {
        const currentSelected = isEditMode ? editSelected : createSelected
        const setCurrentSelected = isEditMode ? setEditSelected : setCreateSelected

        const isSelected = currentSelected.some((v) => v.id === video.id)

        if (isSelected) {
            setCurrentSelected((prev) => prev.filter((v) => v.id !== video.id))
        } else {
            setCurrentSelected((prev) => [...prev, video])
        }
    }

    const renderVideoSelectionModal = (
        title: string,
        name: string,
        setName: (name: string) => void,
        selectedVideos: Video[],
        onSave: () => void,
        onCancel: () => void,
        isEditMode = false,
    ) => (
        <div className="modal">
        <div className="modal-content">
            <h3>{title}</h3>
            <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist Name"
            className="name-input"
            />

            <div className="video-selection-container">
            {/* Available Videos Section */}
            <div className="available-videos">
                <h4>Available Videos</h4>
                <div className="video-list">
                {allVideos.map((video) => (
                    <div key={video.id} className="video-item">
                    <input
                        type="checkbox"
                        checked={selectedVideos.some((v) => v.id === video.id)}
                        onChange={() => toggleVideoSelection(video, isEditMode)}
                    />
                    <span>{video.caption}</span>
                    </div>
                ))}
                </div>
            </div>

            {/* Selected Videos Section with Drag & Drop */}
            <div className="selected-videos">
                <h4>Selected Videos (Drag to reorder)</h4>
                {selectedVideos.length > 0 ? (
                        <div className="draggable-list">
                            {selectedVideos.map((video, index) => (
                                <div
                                key={video.id}
                                className="draggable-item"
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
                                <span className="drag-handle">⋮⋮</span>
                                <span>
                                    {index + 1}. {video.caption}
                                </span>
                                <button
                                    onClick={() => toggleVideoSelection(video, isEditMode)}
                                    className="remove-btn"
                                >
                                    ×
                                </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-message">No videos selected</p>
                    )}
            </div>
            </div>

            <div className="modal-actions">
            <button onClick={onSave} className="save-btn">
                {isEditMode ? "Save Changes" : "Create Playlist"}
            </button>
            <button onClick={onCancel} className="cancel-btn">
                Cancel
            </button>
            </div>
        </div>
        </div>
    )

    return (
        <main>
            <div className="playlist-container">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)} // Go back to the previous page
                    className="create-btn"
                >
                    Back
                </button>

                <h2>My Playlists</h2>

                {errorMessage && (
                    <div className="error-banner">
                        <span>{errorMessage}</span>
                        <button onClick={() => setErrorMessage(null)}>×</button>
                    </div>
                )}

                <button className="create-btn" onClick={() => setIsCreateModalOpen(true)}>
                    Create Playlist
                </button>

                <div className="playlist-list">
                    {playlists.map((playlist) => (
                    <div key={playlist.id} className="playlist-item">
                        <div className="playlist-info">
                        <h3>{playlist.name}</h3>
                        <p>{playlist.videos.length} videos</p>
                        </div>
                        <div className="playlist-actions">
                        <button onClick={() => openEdit(playlist)} className="edit-btn">
                            Edit
                        </button>
                        <button
                            onClick={() => {
                                setPlaylistToDelete(playlist)
                                setIsDeleteConfirmOpen(true)
                            }}
                            className="delete-btn"
                            >
                            Delete
                        </button>
                        </div>
                    </div>
                    ))}
                </div>

                {/* Create Modal */}
                {isCreateModalOpen &&
                    renderVideoSelectionModal("Create Playlist", createName, setCreateName, createSelected, createPlaylist, () => {
                    setIsCreateModalOpen(false)
                    setCreateName("")
                    setCreateSelected([])
                    })}

                {/* Edit Modal */}
                {selectedPlaylist &&
                    renderVideoSelectionModal(
                        "Edit Playlist",
                    editName,
                    setEditName,
                    editSelected,
                    saveEdit,
                    () => {
                        setSelectedPlaylist(null)
                        setEditSelected([])
                    },
                    true,
                    )}

                {/* Delete Confirmation Modal */}
                {isDeleteConfirmOpen && playlistToDelete && (
                    <div className="modal">
                    <div className="modal-content delete-modal">
                        <h3>Delete Playlist</h3>
                        <p>Are you sure you want to delete "{playlistToDelete.name}"?</p>
                        <div className="modal-actions">
                        <button onClick={deletePlaylist} className="delete-confirm-btn">
                            Yes, Delete
                        </button>
                        <button
                            onClick={() => {
                                setIsDeleteConfirmOpen(false)
                            setPlaylistToDelete(null)
                        }}
                        className="cancel-btn"
                        >
                            Cancel
                        </button>
                        </div>
                    </div>
                    </div>
                )}

                <style>
                    {`
                    /* Global */
                    html, body {
                        height: 100%;                  /* Ensure the body takes up the full height */
                        margin: 0;                     /* Remove default margin */
                        background-color: #121212;     /* Dark background for the page */
                        color: #e0e0e0;                /* Lighter text color for dark mode */
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }

                    main {
                        height: 100vh;
                        overflow-y: auto;
                        background-color: #121212;     /* Dark background */
                    }

                    /* Playlist Container */
                    .playlist-container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        color: #e0e0e0;                /* Light text for readability */
                    }

                    /* Buttons */
                    .create-btn, .edit-btn, .delete-btn, .save-btn, .cancel-btn, .delete-confirm-btn {
                        background-color: #333;         /* Dark button background */
                        color: white;                   /* Light text color */
                        border: 1px solid #444;         /* Slightly lighter border */
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 8px 0;
                    }

                    .create-btn:hover, .edit-btn:hover, .delete-btn:hover, .save-btn:hover, .cancel-btn:hover, .delete-confirm-btn:hover {
                        background-color: #444;         /* Darker shade on hover */
                    }

                    /* Playlist List */
                    .playlist-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    /* Playlist Items */
                    .playlist-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px;
                        border: 1px solid #444;         /* Darker border */
                        border-radius: 8px;
                        background-color: #333;         /* Dark background for playlist items */
                    }

                    .playlist-info h3 {
                        margin: 0 0 4px 0;
                        font-size: 18px;
                        color: #e0e0e0;                /* Light text */
                    }

                    .playlist-info p {
                        margin: 0;
                        color: #bbb;                    /* Slightly darker text */
                    }

                    /* Modal */
                    .modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5); /* Semi-transparent dark background */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }

                    .modal-content {
                        background: #2e2e2e;            /* Dark modal background */
                        padding: 24px;
                        border-radius: 12px;
                        width: 90%;
                        max-width: 700px;
                        max-height: 80vh;
                        overflow-y: auto;
                    }

                    /* Input Fields */
                    .name-input {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #555;         /* Dark border */
                        background-color: #333;         /* Dark input background */
                        color: #e0e0e0;                 /* Light text color */
                        border-radius: 6px;
                        font-size: 16px;
                        margin-bottom: 20px;
                    }

                    /* Video Selection */
                    .video-selection-container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 20px;
                    }

                    /* Available Videos */
                    .available-videos, .selected-videos {
                        border: 1px solid #444;         /* Dark border */
                        border-radius: 8px;
                        padding: 16px;
                        background-color: #333;         /* Dark background */
                    }

                    /* Video Items */
                    .video-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 0;
                        border-bottom: 1px solid #555;  /* Darker border */
                        color: #e0e0e0;                 /* Light text */
                    }

                    .video-item:last-child {
                        border-bottom: none;
                    }

                    /* Draggable Item */
                    .draggable-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 12px;
                        margin-bottom: 8px;
                        background: #444;               /* Dark background for draggable items */
                        border: 1px solid #555;         /* Darker border */
                        border-radius: 6px;
                        cursor: grab;
                        color: #e0e0e0;                 /* Light text */
                    }

                    .draggable-item:active {
                        cursor: grabbing;
                    }

                    .draggable-item.dragging {
                        background: #555;               /* Lighter background when dragging */
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    }

                    /* Empty Message */
                    .empty-message {
                        color: #bbb;                    /* Slightly lighter text */
                        font-style: italic;
                        text-align: center;
                        padding: 20px;
                    }

                    /* Delete Button */
                    .remove-btn {
                        margin-left: auto;
                        background: #dc3545;             /* Red background for remove button */
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    /* Modal Actions */
                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                    }

                    /* Responsive Styling */
                    @media (max-width: 768px) {
                        .video-selection-container {
                            grid-template-columns: 1fr;
                        }

                        .modal-content {
                            width: 95%;
                            padding: 16px;
                        }
                    }

                    .error-banner {
                        background-color: #ff4d4f;
                        color: white;
                        padding: 12px 16px;
                        border-radius: 6px;
                        margin-bottom: 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-weight: bold;
                    }
                    
                    .error-banner button {
                        background: transparent;
                        border: none;
                        color: white;
                        font-size: 20px;
                        cursor: pointer;
                    }
                    `}
                </style>
            </div>
        </main>
    )
}

export default PlaylistPage
