import React, { useEffect, useState } from "react";
import { playlistClient } from "../../api/grpc/playlistClient";
import { videoClient } from "../../api/grpc/videoClient";
import type { Video } from "../../api/gen/video";
import type { CreatePlaylistRequest, CreatePlaylistResponse, GetPlaylistByUserIdResponse, Playlist } from "../../api/gen/playlist";
import { useAuth } from "../../utils/AuthProvider";

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

    const openEdit = (p: Playlist) => {
        setSelectedPlaylist(p);
        setEditName(p.name);
        // Ensure the selected videos match based on their ID
        setEditSelected(allVideos.filter((v) => p.videos.some((video) => video.id === v.id)));
    };

    const saveEdit = () => {
        if (!selectedPlaylist) return;
        const updated = playlists.map((p) =>
            p.id === selectedPlaylist.id ? { ...p, name: editName, videos: editSelected } : p
        );
        setPlaylists(updated);
        setSelectedPlaylist(null);
    };

    const createPlaylist = async () => {
        if (!user?.id) {
            console.error("User ID is required to create a playlist");
            return;
        }
        console.log("User ID:", user.id);

        if (!createName || createSelected.length === 0) {
            console.error("Playlist name and videos are required");
            return;
        }

        const req: CreatePlaylistRequest = {
            name: createName,
            userId: user?.id ?? "0",
            videoIds: createSelected.map((v) => v.id.toString()), // Extracting IDs from Video[]
        }
        
        try {
            const res: CreatePlaylistResponse = await playlistClient.CreatePlaylist(req);

            if (res && res.playlistId) {
                console.log("Playlist created:", res);
                
                const newPlaylist: Playlist = {
                    id: res.playlistId,
                    name: createName,
                    userId: user?.id ?? "0",
                    videos: createSelected, // Using Video[] directly
                };
                setPlaylists((prev) => [...prev, newPlaylist]);
                setIsCreateModalOpen(false);
                setCreateName("");
                setCreateSelected([]);
            }
        } catch (error) {
            console.error("Failed to create playlist:", error);
        }
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
                    </li>
                ))}
            </ul>

            {selectedPlaylist && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Edit Playlist</h3>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Playlist Name" />
                        <div>
                            {allVideos.map((v) => (
                                <label key={v.id}>
                                    <input
                                        type="checkbox"
                                        checked={editSelected.some((video) => video.id === v.id)} // Checking by full Video object
                                        onChange={() =>
                                            setEditSelected((prev) =>
                                                prev.some((video) => video.id === v.id)
                                                    ? prev.filter((video) => video.id !== v.id)
                                                    : [...prev, v] // Adding full video object
                                            )
                                        }
                                    />
                                    {v.caption}
                                </label>
                            ))}
                        </div>
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
                        <div>
                            {allVideos.map((v) => (
                                <label key={v.id}>
                                    <input
                                        type="checkbox"
                                        checked={createSelected.some((video) => video.id === v.id)} // Checking by full Video object
                                        onChange={() =>
                                            setCreateSelected((prev) =>
                                                prev.some((video) => video.id === v.id)
                                                    ? prev.filter((video) => video.id !== v.id)
                                                    : [...prev, v] // Adding full video object
                                            )
                                        }
                                    />
                                    {v.caption}
                                </label>
                            ))}
                        </div>
                        <button onClick={createPlaylist}>Create</button>
                        <button onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
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
