import React, { useEffect, useRef, useState } from "react";
// import CommentSidebar from "../components/CommentBar";
import { useVideos } from "../../../hooks/useVideos";

const VideoFeed: React.FC = () => {
    const { videos, loading } = useVideos(1, 10); // or pass page/limit dynamically
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(true);
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    // const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

    // Update volume for all videos
    useEffect(() => {
        videoRefs.current.forEach(video => {
            if (video) {
                video.volume = volume;
                video.muted = isMuted;
            }
        });
    }, [volume, isMuted]);

    // Handle video playback based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            const container = document.querySelector('.video-feed-container');
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const containerHeight = containerRect.height;

            videoRefs.current.forEach((video) => {
                if (!video) return;

                const videoRect = video.getBoundingClientRect();
                const videoCenter = videoRect.top + videoRect.height / 2;
                const isVideoInView = videoCenter >= 0 && videoCenter <= containerHeight;

                if (isVideoInView) {
                    // Play video when in view
                    video.play().catch(console.error);
                } else {
                    // Pause video when out of view
                    video.pause();
                }
            });
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
    }, [videos]);

    // Play first video on mount
    useEffect(() => {
        if (videoRefs.current[0]) {
            videoRefs.current[0].play().catch(console.error);
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
                                            background: 'rgba(0, 0, 0, 0.7)',
                                            padding: '1rem 0.5rem',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            minHeight: '120px',
                                        }}
                                    >
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={volume}
                                            onChange={(e) => {
                                                const newVolume = parseFloat(e.target.value);
                                                setVolume(newVolume);
                                                if (newVolume > 0 && isMuted) {
                                                    setIsMuted(false);
                                                }
                                            }}
                                            style={{
                                                writingMode: 'vertical-lr',
                                                width: '100px',
                                                height: '20px',
                                                transform: 'rotate(180deg)',
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <span style={{
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            textAlign: 'center'
                                        }}>
                                            {Math.round(volume * 100)}%
                                        </span>
                                    </div>
                                )}
                                
                                {/* Volume/Mute Button */}
                                <button
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '45px',
                                        height: '45px',
                                        fontSize: '18px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.3s ease',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMuted(!isMuted);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
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
                            <div style={{
                                maxWidth: '600px',
                                margin: '0 auto',
                            }}>
                                <p style={{
                                    fontSize: '1rem',
                                    lineHeight: '1.5',
                                    marginBottom: '1rem',
                                    color: 'white',
                                }}>
                                    {video.description}
                                </p>
                                
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
            {/* <CommentSidebar /> */}
        </div>
    );
};

export default VideoFeed;
