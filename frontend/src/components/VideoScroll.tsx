import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";
import { followClient } from "../api/grpc/followClient";
import type { LikeRequest, UnlikeRequest } from "../api/gen/like";
import { likeClient } from "../api/grpc/likeClient";
import { videoClient } from "../api/grpc/videoClient";
import CommentBar from "../pages/ui/CommentBar";
import { avatarBytesToUrl } from "../utils/avatarConverter";
import defaultAvatar from "../assets/default.jpg";
import ShareVideoModal from "../pages/modals/ShareVideoModal";

interface props {
    videos: Video[],
    setVideos: React.Dispatch<React.SetStateAction<Video[]>>,
    loading: boolean
}

const VideoScroll: React.FC<props> = ({ videos, setVideos, loading }) => {
    const user = useAuth().user;
    const navigate = useNavigate();
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(true);
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
    const [showComments, setShowComments] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [currentVideoTime, setCurrentVideoTime] = useState(0);
    const [currentVideoDuration, setCurrentVideoDuration] = useState(0);
    const [canComment, setCanComment] = useState<boolean>(true);
    const [captionsMap, setCaptionsMap] = useState<{ [videoId: number]: { en: string[], id: string[] } }>({});
    const [selectedLanguage, setSelectedLanguage] = useState<"en" | "id">("en");
    const [showCaptions, setShowCaptions] = useState<boolean>(false);
    const [followersMap, setFollowersMap] = useState<{ [userId: number]: number[] }>({});
    const [expandedCaptions, setExpandedCaptions] = useState<{ [videoId: number]: boolean }>({});
    const [expandedDescriptions, setExpandedDescriptions] = useState<{ [videoId: number]: boolean }>({});
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [downloadUrl, setDownloadUrl] = useState<string>("");
    const [caption, setCaption] = useState<string>("");

    const scrollToVideo = (index: number) => {
        setCurrentVideoIndex(index);
        setSelectedVideoId(videos[index]?.id);

        requestAnimationFrame(() => {
            const targetVideo = videoRefs.current[index];
            if (targetVideo) {
                targetVideo.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    };

    const toggleCaption = (videoId: number) => {
        setExpandedCaptions(prev => ({ ...prev, [videoId]: !prev[videoId] }));
    };

    const toggleDescription = (videoId: number) => {
        setExpandedDescriptions(prev => ({ ...prev, [videoId]: !prev[videoId] }));
    };

    const fetchFollowers = async (userId: number) => {
        try {
            const res = await followClient.GetFollowers({ userId });
            const followerIds = res.follows.map(f => f.followerId);
            setFollowersMap(prev => ({ ...prev, [userId]: followerIds }));
        } catch (err) {
            console.error("Failed to fetch followers", err);
        }
    };

    const fetchCaptions = async (videoId: number) => {
        try {
            const res = await videoClient.GetCaptions({ videoId });
            if (res && res.captions) {
                setCaptionsMap(prev => ({
                    ...prev,
                    [videoId]: {
                        en: res.captions["en"]?.lines || [],
                        id: res.captions["id"]?.lines || [],
                    },
                }));
            }
        } catch (err) {
            console.error("Failed to fetch captions:", err);
        }
    };

    useEffect(() => {
        if (selectedVideoId && !captionsMap[selectedVideoId]) {
            fetchCaptions(selectedVideoId);
        }
    }, [selectedVideoId]);

    const formatTime = (timeInSeconds: number): string => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentVideoTime(newTime);
        
        // Fix: Use data-id instead of id, and convert selectedVideoId to string for comparison
        const activeVideo = videoRefs.current.find(video => 
            video && video.dataset.id === String(selectedVideoId)
        );
        
        if (activeVideo) {
            activeVideo.currentTime = newTime;
        }
    };

    useEffect(() => {
        const activeVideo = videoRefs.current.find(
            video => video && parseInt(video.dataset.id || "") === selectedVideoId
        );

        if (!activeVideo) return;

        const updateTime = () => {
            setCurrentVideoTime(activeVideo.currentTime);
            setCurrentVideoDuration(activeVideo.duration || 0);
        };

        activeVideo.addEventListener('timeupdate', updateTime);

        return () => {
            activeVideo.removeEventListener('timeupdate', updateTime);
        };
    }, [selectedVideoId]);


    const handleLike = async (videoId: number) => {
        console.log(`Liked video ${videoId}`);
        try {
            if (!user || !user.id) {
                setErrorMessage("User is not authenticated.");
                return;
            }

            const req: LikeRequest = {
                userId: Number(user.id),
                videoId: videoId,
            };

            const res = await likeClient.Like(req);

            if (res) {
                setVideos(prevVideos =>
                    prevVideos.map(video =>
                        video.id === videoId
                            ? { ...video, isLiked: true, likeCount: (Number(video.likeCount) + 1).toString() }
                            : video
                    )
                );
            }
        } catch (err) {
            console.error("Failed to like video", err);
            setErrorMessage("Failed to like the video.");
        }
    };

    const handleUnlike = async (videoId: number) => {
        console.log(`Unliked video ${videoId}`)
        try {
            if (!user || !user.id) {
                setErrorMessage("User is not authenticated.");
                return;
            }

            const req: UnlikeRequest = {
                userId: Number(user.id),
                videoId: videoId,
            };

            const res = await likeClient.Unlike(req)

            if (res) {
                setVideos(prevVideos =>
                    prevVideos.map(video =>
                        video.id === videoId
                            ? { ...video, isLiked: false, likeCount: (Number(video.likeCount) - 1).toString() }
                            : video
                    )
                );
            }
        } catch (err) {
            console.error("Failed to like video", err);
            setErrorMessage("Failed to like the video.");
        }
    }

    const handleComment = (videoId: number) => {
        if (selectedVideoId === videoId && showComments) {
            setShowComments(false);
        } else {
            setSelectedVideoId(videoId);
            setShowComments(true);
        }
    };

    const handleCloseComments = () => {
        setShowComments(false);
        setSelectedVideoId(null);
    };

    const handleShare = (videoId: number, videoUrl: string, caption: string) => {
        console.log(`Share video ${videoId}`);
        setVideoUrl(`${window.location.origin}/video/${videoId}`);
        setDownloadUrl(videoUrl);
        setCaption(caption);
        setIsModalOpen(true);
    };

    const handleSave = (videoId: number) => {
        console.log(`Saved video ${videoId}`);
        // TODO: add save logic here
    };

    // Handle user profile navigation
    const handleUserClick = (username: string) => {
        console.log(`Nagivating to /${username}`);
        navigate(`/${username}`);
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
                    video.play().catch(console.error);
                    currentVideoId = videos[index]?.id || null;
                    setCanComment(videos[index]?.allowComments ?? true);
                    if (currentVideoIndex !== index) {
                        setCurrentVideoIndex(index);
                    }
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            });

            // Update selectedVideoId only if it has changed
            if (currentVideoId !== null && currentVideoId !== selectedVideoId) {
                setSelectedVideoId(currentVideoId);
                const videoOwnerId = videos.find(v => v.id === currentVideoId)?.user?.id;
                if (videoOwnerId && !(videoOwnerId in followersMap)) {
                    fetchFollowers(Number(videoOwnerId));
                }
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

    const handleFollow = async (videoOwnerId: number) => {
        if (!user?.id) return;
        try {
            await followClient.Follow({ followerId: Number(user.id), followedId: videoOwnerId });
            // Optional: re-fetch or optimistically update
            setFollowersMap(prev => ({
                ...prev,
                [videoOwnerId]: [...(prev[videoOwnerId] || []), Number(user.id)],
            }));
        } catch (err) {
            console.error("Failed to follow", err);
        }
    };

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
                                data-id={video.id}
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
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
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
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
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
                                <div style={{
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                    }}
                                >
                                    {video.user?.avatar ? (
                                        <div 
                                        style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center' 
                                        }}
                                        >
                                            <img
                                            src={avatarBytesToUrl(video.user.avatar) || defaultAvatar}
                                            alt={`${video.user.username || 'User'}'s profile`}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => video.user?.username && handleUserClick(video.user.username)}
                                            />
                                            {video.user?.id !== user?.id && !followersMap[Number(video.user.id)]?.includes(Number(user?.id)) && (
                                            <button
                                                onClick={() => handleFollow(Number(video.user?.id))}
                                                style={{
                                                marginTop: '4px',
                                                fontSize: '0.7rem',
                                                borderRadius: '20px',
                                                padding: '2px 8px',
                                                backgroundColor: '#ff2d55',
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                                }}
                                            >
                                                +
                                            </button>
                                            )}
                                        </div>
                                        ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'gray' }}>👤</div>
                                        )}
                                </div>

                                {/* Username */}
                                <div
                                    onClick={() => video.user?.username && handleUserClick(video.user.username)}
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
                                }}>
                                    {(() => {
                                        const desc = video.description;
                                        const isExpanded = expandedDescriptions[video.id];
                                        const maxLength = 120;

                                        if (desc.length <= maxLength || isExpanded) {
                                            return (
                                                <>
                                                    {desc}
                                                    {desc.length > maxLength && (
                                                        <span
                                                            style={{ color: '#aaa', cursor: 'pointer', marginLeft: '8px' }}
                                                            onClick={() => toggleDescription(video.id)}
                                                        >
                                                            See less
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        }

                                        return (
                                            <>
                                                {desc.slice(0, maxLength)}...
                                                <span
                                                    style={{ color: '#aaa', cursor: 'pointer', marginLeft: '8px' }}
                                                    onClick={() => toggleDescription(video.id)}
                                                >
                                                    See more
                                                </span>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                            {showCaptions && (
                                <div style={{ fontSize: '1rem', lineHeight: '1.4', marginBottom: '0.75rem', fontWeight: '500', color: 'white' }}>
                                    {(() => {
                                        const fullCaption = captionsMap[video.id]?.[selectedLanguage]?.join(" ") || video.caption || "";
                                        const isExpanded = expandedCaptions[video.id];
                                        const maxLength = 100;

                                        if (!fullCaption) return null;
                                        if (fullCaption.length <= maxLength || isExpanded) {
                                            return (
                                                <>
                                                    {fullCaption}
                                                    {fullCaption.length > maxLength && (
                                                        <span
                                                            style={{ color: '#bbb', cursor: 'pointer', marginLeft: '8px' }}
                                                            onClick={() => toggleCaption(video.id)}
                                                        >
                                                            See less
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        }

                                        return (
                                            <>
                                                {fullCaption.slice(0, maxLength)}...
                                                <span
                                                    style={{ color: '#bbb', cursor: 'pointer', marginLeft: '8px' }}
                                                    onClick={() => toggleCaption(video.id)}
                                                >
                                                    See more
                                                </span>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="d-flex align-center w-100 gap-2">
                                <input
                                    type="range"
                                    min={0}
                                    max={currentVideoDuration}
                                    value={currentVideoTime}
                                    step={0.1}
                                    onChange={handleSeek}
                                    className="flex-grow-1"
                                />
                                <span className="whitespace-nowrap text-sm">
                                    {formatTime(currentVideoTime)} / {formatTime(currentVideoDuration)}
                                </span>
                            </div>
                            
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
                                    {/* Enhanced Like Button */}
                                    <button 
                                        className="btn btn-link"
                                        onClick={() => !video.isLiked ? handleLike(video.id) : handleUnlike(video.id)}
                                        style={{ 
                                            fontSize: '0.9rem',
                                            color: video.isLiked ? '#ff4458' : 'white',
                                            textDecoration: 'none',
                                            padding: '0.5rem',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            transition: 'all 0.2s ease',
                                            transform: video.isLiked ? 'scale(1.05)' : 'scale(1)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!video.isLiked) {
                                                e.currentTarget.style.color = '#ff4458';
                                            }
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!video.isLiked) {
                                                e.currentTarget.style.color = 'white';
                                            }
                                            e.currentTarget.style.transform = video.isLiked ? 'scale(1.05)' : 'scale(1)';
                                        }}
                                    >
                                        <span style={{
                                            fontSize: '1.1rem',
                                            filter: video.isLiked ? 'drop-shadow(0 0 8px #ff4458)' : 'none',
                                        }}>
                                            {video.isLiked ? '❤️' : '🤍'}
                                        </span>
                                        <span style={{ fontWeight: '500' }}>
                                            {video.likeCount}
                                        </span>
                                    </button>
                                    {video.allowComments && (
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
                                            💬 
                                            <span style={{ fontWeight: '500' }}>
                                                {video.commentsCount}
                                            </span>
                                        </button>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        {/* Toggle Caption On/Off */}
                                        <button 
                                            onClick={() => setShowCaptions(!showCaptions)}
                                            style={{
                                                color: showCaptions ? "white" : "grey",
                                                fontSize: '0.9rem',
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
                                            📝 CC
                                        </button>

                                        {/* Language Selection - Only visible if captions are ON */}
                                        {showCaptions && (
                                            <>
                                                <button 
                                                    onClick={() => setSelectedLanguage("en")} 
                                                    style={{ 
                                                        color: selectedLanguage === "en" ? "white" : "grey",
                                                        fontSize: '0.6rem',
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
                                                    EN
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedLanguage("id")} 
                                                    style={{ 
                                                        color: selectedLanguage === "id" ? "white" : "grey",
                                                        fontSize: '0.6rem',
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
                                                    ID
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <button 
                                        className="btn btn-link" 
                                        onClick={() => handleShare(video.id, video.videoUrl, video.caption)}
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
                                <span style={{color: 'red'}}>
                                    {errorMessage}
                                </span>
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
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '1rem',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '1rem',
                            zIndex: 10,
                        }}>
                            <button
                                onClick={() => scrollToVideo(Math.max(0, currentVideoIndex - 1))}
                                disabled={currentVideoIndex === 0}
                                style={{
                                    backgroundColor: '#fff',
                                    border: 'none',
                                    borderRadius: '5%',
                                    padding: '0.6rem',
                                    fontSize: '1.2rem',
                                    cursor: currentVideoIndex > 0 ? 'pointer' : 'not-allowed',
                                    opacity: currentVideoIndex > 0 ? 1 : 0.5,
                                }}
                            >
                                ⬆
                            </button>
                            <button
                                onClick={() => scrollToVideo(Math.min(videos.length - 1, currentVideoIndex + 1))}
                                disabled={currentVideoIndex === videos.length - 1}
                                style={{
                                    backgroundColor: '#fff',
                                    border: 'none',
                                    borderRadius: '5%',
                                    padding: '0.6rem',
                                    fontSize: '1.2rem',
                                    cursor: currentVideoIndex < videos.length - 1 ? 'pointer' : 'not-allowed',
                                    opacity: currentVideoIndex < videos.length - 1 ? 1 : 0.5,
                                }}
                            >
                                ⬇
                            </button>
                        </div>
                        
                    </div>
                ))}
            </div>

            {/* Comment Sidebar */}
            {showComments && selectedVideoId && (
                <CommentBar 
                    videoId={selectedVideoId} 
                    onClose={handleCloseComments}
                    canComment={canComment}
                />
            )}

            <ShareVideoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                videoUrl={videoUrl}
                downloadUrl={downloadUrl}
                caption={caption}
            />
        </div>
    );
};

export default VideoScroll;