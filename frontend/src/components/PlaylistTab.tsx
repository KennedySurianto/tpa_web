import React, { useEffect, useState } from 'react';
import type { GetPlaylistRequest, Playlist } from '../api/gen/playlist';
import { avatarBytesToUrl } from '../utils/avatarConverter';
import { playlistClient } from '../api/grpc/playlistClient';
import { GetPlaylistByUserIdResponse } from '../api/gen/playlist';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthProvider';

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
            }

            try {
                const res: GetPlaylistByUserIdResponse = await playlistClient.GetPlaylistsByUserId(req);
                setPlaylists(res.playlists);
                console.log('fetched playlists: ', res.playlists);
            } catch (error) {
                console.error('Failed to fetch playlists:', error);
            }
        };

        fetchPlaylists();
    }, [userId]);

    return (
        <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', // 250px min width for each card
            gap: '12px',
            paddingBottom: '2rem',
        }}
        >
        {/* Manage Playlist Card - First Grid Item */}
        { isOwnProfile && (
            <div
                style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#000',
                    cursor: 'pointer',
                    width: '100%',
                    aspectRatio: '16 / 9', // Landscape aspect ratio
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#fff',
                    textAlign: 'center',
                }}
                onClick={() => navigate("/playlist")}
            >
                <div
                style={{
                    textDecoration: 'none',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                }}
                >
                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '1rem' }}>📝</div>
                <p
                    style={{
                    margin: 0,
                    fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                    fontWeight: 'bold',
                    }}
                >
                    Manage Playlist
                </p>
                </div>
            </div>
        )}

        {/* Playlists Grid Section */}
        {playlists.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
            <div
                style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: 'clamp(1.5rem, 5vw, 2rem)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '1rem' }}>🎶</div>
                <p
                style={{
                    color: '#ccc',
                    margin: 0,
                    fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                }}
                >
                User don't have any playlists yet
                </p>
            </div>
            </div>
        ) : (
            playlists.map((playlist) => (
            <div
                key={playlist.id}
                style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000',
                cursor: 'pointer',
                width: '100%',
                aspectRatio: '16 / 9', // Landscape aspect ratio
                }}
                onClick={() => alert(`Open playlist: ${playlist.name}`)} // Implement your logic to open playlist details
            >
                <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'start',
                    alignItems: 'center',
                    backgroundColor: '#333',
                    padding: '10px',
                }}
                >
                {/* Display first 3 video thumbnails */}
                {playlist.videos.slice(0, 3).map((video, index) => (
                    video.thumbnail.length !== 0 ? (
                    <img
                        key={index}
                        src={avatarBytesToUrl(video.thumbnail) || undefined} // Fallback to undefined if no thumbnail
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                        width: '30%',
                        height: '100%',
                        objectFit: 'cover',
                        marginRight: '8px',
                        borderRadius: '8px',
                        }}
                    />
                    ) : (
                    <video
                        key={index}
                        style={{
                        width: '30%',
                        height: '100%',
                        objectFit: 'cover',
                        marginRight: '8px',
                        borderRadius: '8px',
                        }}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                        // Set the first frame of the video as the poster (thumbnail)
                        (e.target as HTMLVideoElement).currentTime = 0;
                        }}
                    >
                        <source src={video.videoUrl} type="video/mp4" />
                        {/* Fallback text in case video is not playable */}
                        Your browser does not support the video tag.
                    </video>
                    )
                ))}
                </div>
                <div
                style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#fff',
                    fontSize: '0.75rem',
                    textShadow: '0 0 4px rgba(0,0,0,0.7)',
                }}
                >
                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {playlist.name}
                </div>
                </div>
            </div>
            ))
        )}
        </div>
    );
};

export default PlaylistTab;
