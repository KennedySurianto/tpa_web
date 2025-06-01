import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import for navigation
import CommentBar from "../components/CommentBar";
import { useVideos } from "../../../hooks/useVideos";

const VideoFeed: React.FC = () => {
    const { videos, loading } = useVideos(); // or pass page/limit dynamically
    const navigate = useNavigate(); // Add navigation hook
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(true);
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
    const [showComments, setShowComments] = useState<boolean>(false);

    // Handler
    const handleLike = (videoId: number) => {
        console.log(`Liked video ${videoId}`);
        // TODO: add like logic here
    };

    const handleComment = (videoId: number) => {
        setSelectedVideoId(videoId);  // show comments sidebar for this video
        setShowComments(true);
    };

    const handleCloseComments = () => {
        setShowComments(false);
        setSelectedVideoId(null); // Optional: clear the selected video
    };

    const handleShare = (videoId: number) => {
        console.log(`Share video ${videoId}`);
        // TODO: add share logic here (e.g., open share dialog)
    };

    const handleSave = (videoId: number) => {
        console.log(`Saved video ${videoId}`);
        // TODO: add save logic here
    };

    // Handle user profile navigation
    const handleUserClick = (userId: number | string) => {
        navigate(`/user/${userId}`);
    };

    // Update volume for all videos
    useEffect(() => {
        videoRefs.current.forEach(video => {
            if (video) {
                video.volume = volume;
                video.muted = isMuted;
            }
        });
    }, [volume, isMuted]);

    // Handle video playback and selection based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            const container = document.querySelector('.video-feed-container');
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const containerHeight = containerRect.height;
            let currentVideoId: number | null = null;

            videoRefs.current.forEach((video, index) => {
                if (!video) return;

                const videoRect = video.getBoundingClientRect();
                const videoCenter = videoRect.top + videoRect.height / 2;
                const isVideoInView = videoCenter >= 0 && videoCenter <= containerHeight;

                if (isVideoInView) {
                    // Play video when in view
                    video.play().catch(console.error);
                    // Set this as the current video
                    currentVideoId = videos[index]?.id || null;
                } else {
                    // Pause video when out of view
                    video.pause();
                }
            });

            // Update selectedVideoId only if it has changed
            if (currentVideoId !== null && currentVideoId !== selectedVideoId) {
                setSelectedVideoId(currentVideoId);
            }
        };

        const container = document.querySelector('.video-feed-container');
        if (container) {
            container.addEventListener('scroll', handleScroll);
            // Initial check
            setTimeout(handleScroll, 100);
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [videos, selectedVideoId, navigate]);

    // Play first video on mount and set it as selected
    useEffect(() => {
        if (videoRefs.current[0] && videos.length > 0) {
            videoRefs.current[0].play().catch(console.error);
            setSelectedVideoId(videos[0].id);
        }
    }, [videos]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem'
            }}>
                Loading videos...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
            {/* Video Feed Section */}
            <div 
                className="video-feed-container" 
                style={{
                    flex: 1,
                    height: '100vh',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    scrollBehavior: 'smooth',
                    backgroundColor: '#000',
                }}
            >
                {videos.map((video, index) => (
                    <div
                        key={video.id}
                        style={{
                            height: '100vh',
                            width: '100%',
                            scrollSnapAlign: 'start',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            backgroundColor: '#000',
                        }}
                    >
                        {/* Video Container */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative',
                        }}>
                            <video
                                ref={(el) => {
                                    videoRefs.current[index] = el;
                                    if (el) {
                                        el.volume = volume;
                                        el.muted = isMuted;
                                    }
                                }}
                                src={video.videoUrl}
                                loop
                                muted={isMuted}
                                playsInline
                                preload="metadata"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain', // Changed from 'cover' to 'contain'
                                    maxHeight: '100vh',
                                    maxWidth: '100%',
                                }}
                                onClick={(e) => {
                                    const video = e.currentTarget;
                                    if (video.paused) {
                                        video.play();
                                    } else {
                                        video.pause();
                                    }
                                }}
                            />
                            
                            {/* Custom Play/Pause Button */}
                            <button
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '60px',
                                    height: '60px',
                                    fontSize: '24px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.3s ease',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const video = videoRefs.current[index];
                                    if (video) {
                                        if (video.paused) {
                                            video.play();
                                        } else {
                                            video.pause();
                                        }
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0';
                                }}
                            >
                                ⏯️
                            </button>

                            {/* Volume Control */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                                onMouseEnter={() => setShowVolumeControl(true)}
                                onMouseLeave={() => setShowVolumeControl(false)}
                            >
                                {/* Volume Slider */}
                                {showVolumeControl && (
                                    <div
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.8)',
                                            padding: '1.5rem 0.75rem',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            minHeight: '200px',
                                            backdropFilter: 'blur(4px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                    >
                                        <span style={{
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            textAlign: 'center',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {Math.round(volume * 100)}%
                                        </span>
                                        
                                        {/* Custom Vertical Slider Container */}
                                        <div style={{
                                            position: 'relative',
                                            width: '6px',
                                            height: '120px',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                        }}>
                                            {/* Volume Fill */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${volume * 100}%`,
                                                background: 'linear-gradient(to top, #ffffff 0%, #e0e0e0 100%)',
                                                borderRadius: '3px',
                                                transition: 'height 0.1s ease',
                                            }} />
                                            
                                            {/* Volume Handle */}
                                            <div style={{
                                                position: 'absolute',
                                                left: '50%',
                                                bottom: `${volume * 100}%`,
                                                transform: 'translate(-50%, 50%)',
                                                width: '14px',
                                                height: '14px',
                                                background: 'white',
                                                borderRadius: '50%',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                                cursor: 'pointer',
                                                transition: 'transform 0.1s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1)';
                                            }}
                                            />
                                            
                                            {/* Invisible input for interaction */}
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={volume}
                                                onChange={(e) => {
                                                    const newVolume = parseFloat(e.target.value);
                                                    setVolume(newVolume);
                                                    if (newVolume > 0 && isMuted) {
                                                        setIsMuted(false);
                                                    }
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: '50%',
                                                    transform: 'translateX(-50%) rotate(-90deg)',
                                                    transformOrigin: 'center',
                                                    width: '120px',
                                                    height: '20px',
                                                    opacity: 0,
                                                    cursor: 'pointer',
                                                    zIndex: 10,
                                                }}
                                            />
                                        </div>
                                        
                                        {/* Volume Level Indicators */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px',
                                            alignItems: 'center',
                                        }}>
                                            {[100, 75, 50, 25, 0].map((level) => (
                                                <div
                                                    key={level}
                                                    style={{
                                                        width: '3px',
                                                        height: '2px',
                                                        background: Math.round(volume * 100) >= level 
                                                            ? 'rgba(255, 255, 255, 0.8)' 
                                                            : 'rgba(255, 255, 255, 0.3)',
                                                        borderRadius: '1px',
                                                        transition: 'background 0.2s ease',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Volume/Mute Button */}
                                <button
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        borderRadius: '50%',
                                        width: '48px',
                                        height: '48px',
                                        fontSize: '20px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        backdropFilter: 'blur(4px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMuted(!isMuted);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    {isMuted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
                                </button>
                            </div>
                        </div>

                        {/* Video Info Overlay */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                            padding: '2rem 1rem 1rem',
                            color: 'white',
                        }}>
                            {/* User Profile Section */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '1rem',
                                gap: '0.75rem',
                            }}>
                                {/* Profile Picture */}
                                <div
                                    onClick={() => video.user?.id && handleUserClick(video.user.id)}
                                    style={{
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                    }}
                                >
                                    {video.user?.profileUrl ? (
                                        <img
                                            src={video.user.profileUrl}
                                            alt={`${video.user.username || 'User'}'s profile`}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                            }}
                                            onError={(e) => {
                                                // If image fails to load, replace with emoji
                                                e.currentTarget.style.display = 'none';
                                                const emojiDiv = document.createElement('div');
                                                emojiDiv.innerHTML = '👤';
                                                emojiDiv.style.cssText = `
                                                    width: 40px;
                                                    height: 40px;
                                                    border-radius: 50%;
                                                    background: rgba(255, 255, 255, 0.1);
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    font-size: 20px;
                                                    border: 2px solid rgba(255, 255, 255, 0.2);
                                                `;
                                                e.currentTarget.parentNode?.replaceChild(emojiDiv, e.currentTarget);
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            border: '2px solid rgba(255, 255, 255, 0.2)',
                                        }}>
                                            👤
                                        </div>
                                    )}
                                </div>

                                {/* Username */}
                                <div
                                    onClick={() => video.user?.id && handleUserClick(video.user.id)}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        color: 'white',
                                        textDecoration: 'none',
                                        transition: 'color 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ffffff80';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'white';
                                    }}
                                >
                                    @{video.user?.username || 'anonymous'}
                                </div>
                            </div>

                            {/* Video Caption */}
                            {video.caption && (
                                <div style={{
                                    fontSize: '1rem',
                                    lineHeight: '1.4',
                                    marginBottom: '0.75rem',
                                    fontWeight: '500',
                                    color: 'white',
                                }}>
                                    {video.caption}
                                </div>
                            )}

                            {/* Video Description */}
                            {video.description && (
                                <div style={{
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4',
                                    marginBottom: '1.5rem',
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    maxHeight: '3em',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                }}>
                                    {video.description}
                                </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    flexWrap: 'wrap',
                                }}>
                                    <button 
                                        className="btn btn-link"
                                        onClick={() => handleLike(video.id)}
                                        style={{ 
                                            fontSize: '0.9rem',
                                            color: 'white',
                                            textDecoration: 'none',
                                            padding: '0.5rem',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                        }}
                                    >
                                        👍 Like
                                    </button>
                                    <button 
                                        className="btn btn-link" 
                                        onClick={() => handleComment(video.id)}
                                        style={{ 
                                            fontSize: '0.9rem',
                                            color: 'white',
                                            textDecoration: 'none',
                                            padding: '0.5rem',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                        }}
                                    >
                                        💬 Comment
                                    </button>
                                    <button 
                                        className="btn btn-link" 
                                        onClick={() => handleShare(video.id)}
                                        style={{ 
                                            fontSize: '0.9rem',
                                            color: 'white',
                                            textDecoration: 'none',
                                            padding: '0.5rem',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                        }}
                                    >
                                        📤 Share
                                    </button>
                                </div>
                                <button 
                                    className="btn btn-link" 
                                    onClick={() => handleSave(video.id)}
                                    style={{ 
                                        fontSize: '0.9rem',
                                        color: 'white',
                                        textDecoration: 'none',
                                        padding: '0.5rem',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                    }}
                                >
                                    📌 Save
                                </button>
                            </div>
                        </div>

                        {/* Video Navigation Hint */}
                        {index === 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                right: '1rem',
                                transform: 'translateY(-50%)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                animation: 'fadeInOut 3s ease-in-out infinite',
                            }}>
                                <div style={{ marginBottom: '0.5rem' }}>↕</div>
                                <div>Scroll</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Comment Sidebar */}
            {showComments && selectedVideoId && (
                <CommentBar 
                    videoId={selectedVideoId} 
                    onClose={handleCloseComments}
                />
            )}
        </div>
    );
};

export default VideoFeed;