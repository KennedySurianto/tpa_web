import React from 'react';
import { Link } from 'react-router-dom'; // Add Link for navigation
import type { Video } from '../api/gen/video';
import { avatarBytesToUrl } from '../utils/avatarConverter';

interface VideoGridProps {
    videos: Video[];
    isOwnProfile: boolean;
    isVideoTab: boolean; // Optional prop to indicate if this is the video tab
    setSelectedVideo: (video: Video) => void;
    setModalOpen: (open: boolean) => void;
}

const VideoTab: React.FC<VideoGridProps> = ({ videos, isOwnProfile, setSelectedVideo, setModalOpen, isVideoTab }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)', // 4 columns in the grid
            gap: '12px',
            paddingBottom: '2rem'
        }}>
            {/* Upload Video Card - Always Displayed as First Grid Item */}
            { isOwnProfile && isVideoTab && (
                
                <div
                    style={{
                        position: 'relative',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#000',
                        cursor: 'pointer',
                        width: '100%',
                        aspectRatio: '3 / 4',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#fff',
                        textAlign: 'center',
                    }}
                >
                    <Link to="/upload" style={{
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
                    }}>
                        <div style={{
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                            marginBottom: '1rem'
                        }}>
                            📤
                        </div>
                        <p style={{
                            margin: 0,
                            fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                            fontWeight: 'bold',
                        }}>
                            Upload Video
                        </p>
                    </Link>
                </div>
            )}
            {/* Display Video Cards */}
            {videos.length > 0 ? (
                videos.map((video) => (
                    <div
                        key={video.id}
                        style={{
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: '#000',
                            cursor: 'pointer',
                            width: '100%',
                            aspectRatio: '3 / 4',
                        }}
                        onClick={() => {
                            setSelectedVideo(video);
                            setModalOpen(true);
                        }}
                    >
                        {video.thumbnail.length !== 0 ? (
                            <img
                                key={video.id}
                                src={avatarBytesToUrl(video.thumbnail) || undefined}
                                alt={`Thumbnail ${video.id}`}
                                style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                marginRight: '8px',
                                borderRadius: '8px',
                                }}
                            />
                            ) : (
                            <video
                                key={video.id}
                                style={{
                                width: '100%',
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
                        )}
                        <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            right: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#fff',
                            fontSize: '0.75rem',
                            textShadow: '0 0 4px rgba(0,0,0,0.7)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>👁</span>
                                <span>{video.viewsCount}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{video.isLiked ? '❤️' : '🤍'}</span>
                                <span>{video.likeCount}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>🗨️</span>
                                <span>{video.commentsCount}</span>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#000',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '1rem',
                    fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 'bold',
                    marginTop: '2rem'
                }}>
                    {isOwnProfile ? "You haven't posted any videos yet" : "No videos yet"}
                </div>
            )}
        </div>
    );
};

export default VideoTab;
