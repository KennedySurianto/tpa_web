import React, { useEffect, useState } from "react";
import { playlistClient } from "../../api/grpc/playlistClient";
import { videoClient } from "../../api/grpc/videoClient";
import type { Video } from "../../api/gen/video";
import type { CreatePlaylistRequest, CreatePlaylistResponse, GetPlaylistByUserIdResponse, Playlist, UpdatePlaylistRequest, UpdatePlaylistResponse } from "../../api/gen/playlist";
import { useAuth } from "../../utils/AuthProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const PlaylistPage: React.FC = () => {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [allVideos, setAllVideos] = useState<Video[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createSelected, setCreateSelected] = useState<Video[]>([]); // Now working with Video[] state
    const [editName, setEditName] = useState("");
    const [editSelected, setEditSelected] = useState<Video[]>([]); // Now working with Video[] state
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false); // For confirming deletion
    const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null); // The playlist to be deleted

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;

            try {
                const res: GetPlaylistByUserIdResponse = await playlistClient.GetPlaylistsByUserId({ id: user?.id.toString() });
                setPlaylists(res.playlists);
                console.log("fetched playlists: ", res.playlists);
            } catch (error) {
                console.error("Failed to fetch playlists:", error);
            }

            try {
                const userVideosRes = await videoClient.GetVideosByUserId({ userId: Number(user.id) });
                setAllVideos(userVideosRes.videos);
                console.log("fetched videos: ", userVideosRes.videos);
            } catch (error) {
                console.error("Failed to fetch videos:", error);
            }
        };

        fetchData();
    }, [user]);

    const onDragEnd = (result: any) => {
        const { destination, source } = result;
        if (!destination) return;  // If dropped outside

        const items = Array.from(editSelected);  // Reordering the videos
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);  // Place it at the new position

        setEditSelected(items);  // Update the state with the new order
    };

    const openEdit = (p: Playlist) => {
        setSelectedPlaylist(p);
        setEditName(p.name);
        // Ensure the selected videos match based on their ID
        setEditSelected(allVideos.filter((v) => p.videos.some((video) => video.id === v.id)));
    };

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
        }
    };

    const openDeleteConfirm = (playlist: Playlist) => {
        setPlaylistToDelete(playlist);
        setIsDeleteConfirmOpen(true);
    };

    const closeDeleteConfirm = () => {
        setIsDeleteConfirmOpen(false);
        setPlaylistToDelete(null);
    };

    return (
        <div className="playlist-container">
            <h2>My Playlists</h2>
            <button className="submit-button" onClick={() => setIsCreateModalOpen(true)}>
                Create Playlist
            </button>

            <ul className="playlist-list">
                {playlists.map((playlist) => (
                    <li key={playlist.id} className="playlist-item">
                        {playlist.name}
                        <button onClick={() => openEdit(playlist)} style={{ marginLeft: 8 }}>
                            Edit
                        </button>
                        <button onClick={() => openDeleteConfirm(playlist)} style={{ marginLeft: 8 }}>
                            Delete
                        </button>
                    </li>
                ))}
            </ul>

            {selectedPlaylist && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Edit Playlist</h3>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Playlist Name" />
                        
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="droppable">
                                {(provided) => (
                                    <ul className="video-list" {...provided.droppableProps} ref={provided.innerRef}>
                                        {editSelected.map((video, index) => (
                                            <Draggable key={video.id} draggableId={video.id.toString()} index={index}>
                                                {(provided) => (
                                                    <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={editSelected.some((v) => v.id === video.id)}
                                                            onChange={() =>
                                                                setEditSelected((prev) =>
                                                                    prev.some((v) => v.id === video.id)
                                                                        ? prev.filter((v) => v.id !== video.id)
                                                                        : [...prev, video]
                                                                )
                                                            }
                                                        />
                                                        {video.caption}
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </ul>
                                )}
                            </Droppable>
                        </DragDropContext>
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={() => setSelectedPlaylist(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Create Playlist</h3>
                        <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Playlist Name" />
                        
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="create-droppable">
                                {(provided) => (
                                    <ul className="video-list" {...provided.droppableProps} ref={provided.innerRef}>
                                        {createSelected.map((video, index) => (
                                            <Draggable key={video.id} draggableId={video.id.toString()} index={index}>
                                                {(provided) => (
                                                    <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={createSelected.some((v) => v.id === video.id)}
                                                            onChange={() =>
                                                                setCreateSelected((prev) =>
                                                                    prev.some((v) => v.id === video.id)
                                                                        ? prev.filter((v) => v.id !== video.id)
                                                                        : [...prev, video]
                                                                )
                                                            }
                                                        />
                                                        {video.caption}
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </ul>
                                )}
                            </Droppable>
                        </DragDropContext>
                        <button onClick={createPlaylist}>Create</button>
                        <button onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && playlistToDelete && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Are you sure you want to delete this playlist?</h3>
                        <p>{playlistToDelete.name}</p>
                        <button onClick={deletePlaylist}>Yes, Delete</button>
                        <button onClick={closeDeleteConfirm}>Cancel</button>
                    </div>
                </div>
            )}

            <style>{`
                .playlist-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: sans-serif;
                }
                .playlist-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px;
                    border: 1px solid #ccc;
                    margin-bottom: 10px;
                    border-radius: 6px;
                }
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                }
                input[type="text"] {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 10px;
                }
                label {
                    display: block;
                    margin: 4px 0;
                }
                .submit-button {
                    margin-bottom: 16px;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default PlaylistPage;
