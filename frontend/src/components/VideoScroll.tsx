import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Subtitles,
  Loader2,
} from "lucide-react";
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
import { ProcessRichText } from "../utils/ProcessRichText";

interface props {
  videos: Video[];
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  loading: boolean;
}

type CaptionLine = {
  start: number;
  end: number;
  text: string;
};

type CaptionsMap = {
  [videoId: number]: {
    en: CaptionLine[];
    id: CaptionLine[];
  };
};

const VideoScroll: React.FC<props> = ({ videos, setVideos, loading }) => {
  const { user, getAuthMetadata } = useAuth();
  const navigate = useNavigate();
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(true);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [currentVideoDuration, setCurrentVideoDuration] = useState(0);
  const [canComment, setCanComment] = useState<boolean>(true);
  const [captionsMap, setCaptionsMap] = useState<CaptionsMap>({});
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "id">("en");
  const [showCaptions, setShowCaptions] = useState<boolean>(false);
  const [followersMap, setFollowersMap] = useState<{ [userId: number]: number[] }>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [videoId: number]: boolean }>(
    {},
  );
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<{ [videoId: number]: boolean }>({});

  const scrollToVideo = (index: number) => {
    setCurrentVideoIndex(index);
    setSelectedVideoId(videos[index]?.id);
    requestAnimationFrame(() => {
      const targetVideo = videoRefs.current[index];
      if (targetVideo) {
        targetVideo.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const toggleDescription = (videoId: number) => {
    setExpandedDescriptions((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  const fetchFollowers = async (userId: number) => {
    try {
      const res = await followClient.GetFollowers({ userId });
      const followerIds = res.follows.map((f) => f.followerId);
      setFollowersMap((prev) => ({ ...prev, [userId]: followerIds }));
    } catch (err) {
      console.error("Failed to fetch followers", err);
    }
  };

  // CAPTIONS
  const fetchCaptions = async (videoId: number) => {
    try {
      const res = await videoClient.GetCaptions({ videoId });
      if (res && res.captions) {
        setCaptionsMap((prev) => ({
          ...prev,
          [videoId]: {
            en: res.captions["en"]?.lines ?? [],
            id: res.captions["id"]?.lines ?? [],
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

  const getCurrentCaption = (videoId: number, time: number, lang: "en" | "id"): string | null => {
    const lines = captionsMap[videoId]?.[lang];
    if (!lines) return null;

    const current = lines.find((line) => time >= line.start && time <= line.end);
    return current?.text ?? null;
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number.parseFloat(e.target.value);
    setCurrentVideoTime(newTime);

    const activeVideo = videoRefs.current.find(
      (video) => video && video.dataset.id === String(selectedVideoId),
    );

    if (activeVideo) {
      activeVideo.currentTime = newTime;
    }
  };

  useEffect(() => {
    const activeVideo = videoRefs.current.find(
      (video) => video && Number.parseInt(video.dataset.id || "") === selectedVideoId,
    );
    if (!activeVideo) return;

    const updateTime = () => {
      setCurrentVideoTime(activeVideo.currentTime);
      setCurrentVideoDuration(activeVideo.duration || 0);
    };

    activeVideo.addEventListener("timeupdate", updateTime);
    return () => {
      activeVideo.removeEventListener("timeupdate", updateTime);
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

      const res = await likeClient.Like(req, getAuthMetadata());
      if (res) {
        setVideos((prevVideos) =>
          prevVideos.map((video) =>
            video.id === videoId
              ? { ...video, isLiked: true, likeCount: (Number(video.likeCount) + 1).toString() }
              : video,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to like video", err);
      setErrorMessage("Failed to like the video.");
    }
  };

  const handleUnlike = async (videoId: number) => {
    console.log(`Unliked video ${videoId}`);
    try {
      if (!user || !user.id) {
        setErrorMessage("User is not authenticated.");
        return;
      }

      const req: UnlikeRequest = {
        userId: Number(user.id),
        videoId: videoId,
      };

      const res = await likeClient.Unlike(req, getAuthMetadata());
      if (res) {
        setVideos((prevVideos) =>
          prevVideos.map((video) =>
            video.id === videoId
              ? { ...video, isLiked: false, likeCount: (Number(video.likeCount) - 1).toString() }
              : video,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to unlike video", err);
      setErrorMessage("Failed to unlike the video.");
    }
  };

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

  const handleUserClick = (username: string) => {
    console.log(`Navigating to /${username}`);
    navigate(`/${username}`);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume > 0.5) return Volume2;
    if (volume > 0.25) return Volume1;
    return Volume;
  };

  const handleVideoClick = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play().catch(console.error);
        setIsPlaying((prev) => ({ ...prev, [videos[index].id]: true }));
      } else {
        video.pause();
        setIsPlaying((prev) => ({ ...prev, [videos[index].id]: false }));
      }
    }
  };

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.volume = volume;
        video.muted = isMuted;
      }
    });
  }, [volume, isMuted]);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector(".video-feed-container");
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
          setIsPlaying((prev) => ({ ...prev, [videos[index].id]: true }));
          currentVideoId = videos[index]?.id || null;
          setCanComment(videos[index]?.allowComments ?? true);
          if (currentVideoIndex !== index) {
            setCurrentVideoIndex(index);
          }
        } else {
          video.pause();
          video.currentTime = 0;
          setIsPlaying((prev) => ({ ...prev, [videos[index].id]: false }));
        }
      });

      if (currentVideoId !== null && currentVideoId !== selectedVideoId) {
        setSelectedVideoId(currentVideoId);
        const videoOwnerId = videos.find((v) => v.id === currentVideoId)?.user?.id;
        if (videoOwnerId && !(videoOwnerId in followersMap)) {
          fetchFollowers(Number(videoOwnerId));
        }
      }
    };

    const container = document.querySelector(".video-feed-container");
    if (container) {
      container.addEventListener("scroll", handleScroll);
      setTimeout(handleScroll, 100);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [videos, selectedVideoId, navigate]);

  useEffect(() => {
    if (videoRefs.current[0] && videos.length > 0) {
      videoRefs.current[0].play().catch(console.error);
      setSelectedVideoId(videos[0].id);
      setIsPlaying((prev) => ({ ...prev, [videos[0].id]: true }));
    }
  }, [videos]);

  const handleFollow = async (videoOwnerId: number) => {
    if (!user?.id) return;

    try {
      await followClient.Follow({ followerId: Number(user.id), followedId: videoOwnerId });
      setFollowersMap((prev) => ({
        ...prev,
        [videoOwnerId]: [...(prev[videoOwnerId] || []), Number(user.id)],
      }));
    } catch (err) {
      console.error("Failed to follow", err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 size={32} className="loading-spinner" />
        <p className="loading-text">Loading videos...</p>
        <style>{`
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
            color: #3b82f6;
          }
          .loading-text {
            font-size: 1.1rem;
            color: #9ca3af;
            margin: 0;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="video-scroll-container">
      {/* Video Feed Section */}
      <div className="video-feed-container">
        {videos.map((video, index) => (
          <div key={video.id} className="video-item">
            {/* Video Container */}
            <div className="video-container">
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
                className="video-element"
                onClick={() => handleVideoClick(index)}
              />

              {/* Play/Pause Overlay */}
              <div className="play-pause-overlay">
                <button
                  className="play-pause-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVideoClick(index);
                  }}
                >
                  {isPlaying[video.id] ? <Pause size={32} /> : <Play size={32} />}
                </button>
              </div>

              {/* Volume Control */}
              <div
                className="volume-control"
                onMouseEnter={() => setShowVolumeControl(true)}
                onMouseLeave={() => setShowVolumeControl(false)}
              >
                <button
                  className="volume-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                >
                  {React.createElement(getVolumeIcon(), { size: 20 })}
                </button>

                {showVolumeControl && (
                  <div className="volume-slider-container">
                    <span className="volume-percentage">{Math.round(volume * 100)}%</span>
                    <div className="volume-slider-track">
                      <div className="volume-slider-fill" style={{ height: `${volume * 100}%` }} />
                      <div
                        className="volume-slider-handle"
                        style={{ bottom: `${volume * 100}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => {
                          const newVolume = Number.parseFloat(e.target.value);
                          setVolume(newVolume);
                          if (newVolume > 0 && isMuted) {
                            setIsMuted(false);
                          }
                        }}
                        className="volume-input"
                      />
                    </div>
                    <div className="volume-indicators">
                      {[100, 75, 50, 25, 0].map((level) => (
                        <div
                          key={level}
                          className={`volume-indicator ${Math.round(volume * 100) >= level ? "active" : ""}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="navigation-controls">
                <button
                  onClick={() => scrollToVideo(Math.max(0, currentVideoIndex - 1))}
                  disabled={currentVideoIndex === 0}
                  className={`nav-button ${currentVideoIndex === 0 ? "disabled" : ""}`}
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  onClick={() => scrollToVideo(Math.min(videos.length - 1, currentVideoIndex + 1))}
                  disabled={currentVideoIndex === videos.length - 1}
                  className={`nav-button ${currentVideoIndex === videos.length - 1 ? "disabled" : ""}`}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>

            {/* Video Info Overlay */}
            <div className="video-info-overlay">
              {/* User Profile Section */}
              <div className="user-profile-section">
                <div className="profile-container">
                  <div className="profile-avatar-container">
                    <img
                      src={
                        video.user?.avatar
                          ? avatarBytesToUrl(video.user.avatar) || defaultAvatar
                          : defaultAvatar
                      }
                      alt={`${video.user?.username || "User"}'s profile`}
                      className="profile-avatar"
                      onClick={() =>
                        video.user?.username &&
                        video.user.username.toLocaleLowerCase() !== "advertiser" &&
                        handleUserClick(video.user.username)
                      }
                    />
                    {video.user?.id !== user?.id &&
                      video.user?.username.toLocaleLowerCase() !== "advertiser" &&
                      !followersMap[Number(video.user?.id)]?.includes(Number(user?.id)) && (
                        <button
                          onClick={() => handleFollow(Number(video.user?.id))}
                          className="follow-button"
                        >
                          <UserPlus size={12} />
                        </button>
                      )}
                  </div>
                  <div
                    onClick={() =>
                      video.user?.username &&
                      video.user.username.toLocaleLowerCase() !== "advertiser" &&
                      handleUserClick(video.user.username)
                    }
                    className="username"
                  >
                    @{video.user?.username || "anonymous"}
                  </div>
                </div>
              </div>

              {/* Video Caption */}
              {video.caption && <div className="video-caption">{video.caption}</div>}

              {/* Video Description */}
              {video.description && (
                <div className="video-description">
                  {(() => {
                    const desc = video.description;
                    const isExpanded = expandedDescriptions[video.id];
                    const maxLength = 120;

                    const displayedText =
                      isExpanded || desc.length <= maxLength
                        ? desc
                        : desc.slice(0, maxLength) + "...";

                    return (
                      <>
                        <ProcessRichText text={displayedText} />
                        {desc.length > maxLength && (
                          <button
                            className="expand-button"
                            onClick={() => toggleDescription(video.id)}
                          >
                            {isExpanded ? "See less" : "See more"}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Captions Display */}
              {showCaptions && video.user?.username.toLocaleLowerCase() !== "advertiser" && (
                <div className="captions-display">
                  {getCurrentCaption(video.id, currentVideoTime, selectedLanguage)}
                </div>
              )}

              {/* Video Progress Bar */}
              <div className="progress-container">
                <input
                  type="range"
                  min={0}
                  max={currentVideoDuration}
                  value={currentVideoTime}
                  step={0.1}
                  onChange={handleSeek}
                  className="progress-slider"
                />
                <div className="time-display">
                  {formatTime(currentVideoTime)} / {formatTime(currentVideoDuration)}
                </div>
              </div>

              {/* Action Buttons */}
              {video.user?.username.toLocaleLowerCase() !== "advertiser" && (
                <div className="action-buttons">
                  <div className="primary-actions">
                    <button
                      onClick={() =>
                        !video.isLiked ? handleLike(video.id) : handleUnlike(video.id)
                      }
                      className={`action-button like-button ${video.isLiked ? "liked" : ""}`}
                    >
                      <Heart size={20} className={video.isLiked ? "filled" : ""} />
                      <span>{video.likeCount}</span>
                    </button>

                    {video.allowComments && (
                      <button
                        onClick={() => handleComment(video.id)}
                        className="action-button comment-button"
                      >
                        <MessageCircle size={20} />
                        <span>{video.commentsCount}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleShare(video.id, video.videoUrl, video.caption)}
                      className="action-button share-button"
                    >
                      <Share2 size={20} />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={() => handleSave(video.id)}
                      className="action-button save-button"
                    >
                      <Bookmark size={20} />
                      <span>Save</span>
                    </button>
                  </div>

                  <div className="secondary-actions">
                    {showCaptions && (
                      <div className="language-buttons">
                        <button
                          onClick={() => setSelectedLanguage("en")}
                          className={`lang-button ${selectedLanguage === "en" ? "active" : ""}`}
                        >
                          EN
                        </button>
                        <button
                          onClick={() => setSelectedLanguage("id")}
                          className={`lang-button ${selectedLanguage === "id" ? "active" : ""}`}
                        >
                          ID
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setShowCaptions(!showCaptions)}
                      className={`action-button caption-button ${showCaptions ? "active" : ""}`}
                    >
                      <Subtitles size={18} />
                      <span>CC</span>
                    </button>
                  </div>

                  {errorMessage && <div className="error-message">{errorMessage}</div>}
                </div>
              )}
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

      <style>{`
        .video-scroll-container {
          display: flex;
          height: 100vh;
          width: 100%;
          background: #000000;
          isolation: isolate;
        }

        .video-feed-container {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          background: #000000;
        }

        .video-item {
          height: 100vh;
          width: 100%;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          position: relative;
          background: #000000;
          isolation: isolate;
        }

        .video-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: contain;
          max-height: 100vh;
          max-width: 100%;
          cursor: pointer;
        }

        .play-pause-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .play-pause-button {
          background: rgba(0, 0, 0, 0.6);
          border: none;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          pointer-events: auto;
        }

        .video-container:hover .play-pause-button {
          opacity: 1;
        }

        .play-pause-button:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }

        .volume-control {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .volume-button {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          z-index: 10;
        }

        .volume-button:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .volume-slider-container {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          padding: 1.5rem 0.75rem;
          border-radius: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          min-height: 200px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .volume-percentage {
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
          margin-bottom: 0.25rem;
        }

        .volume-slider-track {
          position: relative;
          width: 6px;
          height: 120px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          cursor: pointer;
        }

        .volume-slider-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(to top, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 3px;
          transition: height 0.1s ease;
        }

        .volume-slider-handle {
          position: absolute;
          left: 50%;
          transform: translate(-50%, 50%);
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .volume-slider-handle:hover {
          transform: translate(-50%, 50%) scale(1.2);
        }

        .volume-input {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%) rotate(-90deg);
          transform-origin: center;
          width: 120px;
          height: 20px;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
        }

        .volume-indicators {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: center;
        }

        .volume-indicator {
          width: 3px;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 1px;
          transition: background 0.2s ease;
        }

        .volume-indicator.active {
          background: rgba(255, 255, 255, 0.8);
        }

        .navigation-controls {
          position: absolute;
          top: 50%;
          right: 1.5rem;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 10;
        }

        .nav-button {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
        }

        .nav-button:hover:not(.disabled) {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
        }

        .nav-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .video-info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          padding: 3rem 1.5rem 1.5rem;
          color: white;
          z-index: 1;
          transform: translateZ(0);
          will-change: auto;
        }

        .user-profile-section {
          margin-bottom: 1rem;
        }

        .profile-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .profile-avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .profile-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          z-index: 2;
          transform: translateZ(0);
        }

        .profile-avatar:hover {
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.05) translateZ(0);
        }

        .follow-button {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: #ef4444;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 3;
          transform: translateZ(0);
        }

        .follow-button:hover {
          background: #dc2626;
          transform: scale(1.1) translateZ(0);
        }

        .username {
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          transition: color 0.2s ease;
        }

        .username:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .video-caption {
          font-size: 1rem;
          line-height: 1.4;
          margin-bottom: 0.75rem;
          font-weight: 500;
          color: white;
        }

        .video-description {
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 1.5rem;
          color: rgba(255, 255, 255, 0.85);
        }

        .captions-display {
          font-size: 1rem;
          line-height: 1.4;
          margin-bottom: 0.75rem;
          font-weight: 500;
          color: white;
          background: rgba(0, 0, 0, 0.6);
          padding: 0.75rem;
          border-radius: 0.5rem;
          backdrop-filter: blur(10px);
        }

        .expand-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          margin-left: 0.5rem;
          font-size: inherit;
          transition: color 0.2s ease;
        }

        .expand-button:hover {
          color: #ffffff;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .progress-slider {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
        }

        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }

        .progress-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }

        .time-display {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .primary-actions {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .secondary-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .action-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .like-button.liked {
          color: #ef4444;
        }

        .like-button.liked .filled {
          fill: currentColor;
        }

        .caption-button.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .language-buttons {
          display: flex;
          gap: 0.25rem;
        }

        .lang-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .lang-button.active {
          color: white;
          background: rgba(255, 255, 255, 0.2);
        }

        .lang-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 0.25rem;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 768px) {
          .video-info-overlay {
            padding: 2rem 1rem 1rem;
          }

          .action-buttons {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .primary-actions {
            gap: 1rem;
          }

          .volume-control {
            top: 1rem;
            right: 1rem;
          }

          .navigation-controls {
            right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoScroll;
