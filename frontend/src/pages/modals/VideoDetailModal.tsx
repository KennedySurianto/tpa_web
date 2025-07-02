import type React from "react";
import { useState, useRef, useEffect } from "react";
import type { Video } from "../../api/gen/video";
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Flag,
  Download,
  Copy,
  Eye,
  Calendar,
  User,
  Send,
  Reply,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface VideoDetailModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
  isReplying?: boolean;
}

// Mock comments data - replace with actual API calls
const mockComments: Comment[] = [
  {
    id: "1",
    user: {
      id: "user1",
      username: "johndoe",
      avatar: "/placeholder.svg?height=32&width=32",
      isVerified: true,
    },
    content: "This is amazing! Love the creativity 🔥",
    timestamp: "2h",
    likes: 24,
    isLiked: false,
    replies: [
      {
        id: "1-1",
        user: {
          id: "user2",
          username: "janedoe",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        content: "Totally agree! So inspiring",
        timestamp: "1h",
        likes: 5,
        isLiked: true,
      },
    ],
  },
  {
    id: "2",
    user: {
      id: "user3",
      username: "creator_mike",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    content: "How did you achieve this effect? Tutorial please! 🙏",
    timestamp: "4h",
    likes: 12,
    isLiked: false,
  },
  {
    id: "3",
    user: {
      id: "user4",
      username: "artlover",
      avatar: "/placeholder.svg?height=32&width=32",
      isVerified: true,
    },
    content: "The attention to detail is incredible. Keep up the great work! 👏👏👏",
    timestamp: "6h",
    likes: 8,
    isLiked: true,
  },
];

export const VideoDetailModal: React.FC<VideoDetailModalProps> = ({ video, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [showMoreActions, setShowMoreActions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && video) {
      setIsLiked(video.isLiked || false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, video]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Add API call here
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Add API call here
  };

  const handleShare = () => {
    // Implement share functionality
    console.log("Share video");
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        user: {
          id: "current_user",
          username: "you",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        content: newComment,
        timestamp: "now",
        likes: 0,
        isLiked: false,
      };
      setComments([comment, ...comments]);
      setNewComment("");
    }
  };

  const handleReply = (commentId: string) => {
    if (replyText.trim()) {
      const reply: Comment = {
        id: `${commentId}-${Date.now()}`,
        user: {
          id: "current_user",
          username: "you",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        content: replyText,
        timestamp: "now",
        likes: 0,
        isLiked: false,
      };

      setComments(
        comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply],
            };
          }
          return comment;
        }),
      );
      setReplyText("");
      setReplyingTo(null);
    }
  };

  const toggleCommentExpansion = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const handleCommentLike = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        return comment;
      }),
    );
  };

  if (!isOpen || !video) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-container" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <span className="username">@{video.userId || "user"}</span>
              <span className="timestamp">
                <Calendar size={12} />
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-button" onClick={() => setShowMoreActions(!showMoreActions)}>
              <MoreHorizontal size={20} />
            </button>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* More Actions Dropdown */}
        {showMoreActions && (
          <div className="more-actions-dropdown">
            <button className="dropdown-item">
              <Flag size={16} />
              Report
            </button>
            <button className="dropdown-item">
              <Download size={16} />
              Download
            </button>
            <button className="dropdown-item">
              <Copy size={16} />
              Copy Link
            </button>
          </div>
        )}

        <div className="modal-content">
          {/* Video Section */}
          <div className="video-section">
            <div className="video-container">
              <video
                ref={videoRef}
                src={video.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                className="video-player"
                onClick={togglePlay}
              />

              {/* Video Controls Overlay */}
              <div className="video-controls">
                <button className="control-button play-pause" onClick={togglePlay}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button className="control-button volume" onClick={toggleMute}>
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              {/* Video Stats Overlay */}
              <div className="video-stats-overlay">
                <div className="stat-item">
                  <Eye size={14} />
                  <span>{video.viewsCount}</span>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="video-info">
              <h3 className="video-title">{video.caption || "Untitled Video"}</h3>
              {video.description && <p className="video-description">{video.description}</p>}

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className={`action-btn ${isLiked ? "liked" : ""}`} onClick={handleLike}>
                  <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                  <span>{Number(video.likeCount) + (isLiked && !video.isLiked ? 1 : 0)}</span>
                </button>

                <button className="action-btn" onClick={() => setShowComments(!showComments)}>
                  <MessageCircle size={20} />
                  <span>{video.commentsCount}</span>
                </button>

                <button className="action-btn" onClick={handleShare}>
                  <Share2 size={20} />
                  <span>Share</span>
                </button>

                <button className={`action-btn ${isSaved ? "saved" : ""}`} onClick={handleSave}>
                  <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="comments-section">
              <div className="comments-header">
                <h4>Comments ({comments.length})</h4>
                <button className="toggle-comments" onClick={() => setShowComments(false)}>
                  <ChevronUp size={16} />
                </button>
              </div>

              {/* Add Comment */}
              <div className="add-comment">
                <div className="comment-avatar">
                  <User size={16} />
                </div>
                <div className="comment-input-container">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="comment-input"
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <button
                    className="send-button"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      <img
                        src={comment.user.avatar || "/placeholder.svg"}
                        alt={comment.user.username}
                      />
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-username">
                          @{comment.user.username}
                          {comment.user.isVerified && <span className="verified-badge">✓</span>}
                        </span>
                        <span className="comment-timestamp">{comment.timestamp}</span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                      <div className="comment-actions">
                        <button
                          className={`comment-action ${comment.isLiked ? "liked" : ""}`}
                          onClick={() => handleCommentLike(comment.id)}
                        >
                          <ThumbsUp size={12} />
                          <span>{comment.likes}</span>
                        </button>
                        <button
                          className="comment-action"
                          onClick={() =>
                            setReplyingTo(replyingTo === comment.id ? null : comment.id)
                          }
                        >
                          <Reply size={12} />
                          Reply
                        </button>
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="reply-input">
                          <input
                            type="text"
                            placeholder={`Reply to @${comment.user.username}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="comment-input small"
                            onKeyPress={(e) => e.key === "Enter" && handleReply(comment.id)}
                          />
                          <button
                            className="send-button small"
                            onClick={() => handleReply(comment.id)}
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies-section">
                          <button
                            className="show-replies"
                            onClick={() => toggleCommentExpansion(comment.id)}
                          >
                            {expandedComments.has(comment.id) ? (
                              <>
                                <ChevronUp size={12} />
                                Hide {comment.replies.length} replies
                              </>
                            ) : (
                              <>
                                <ChevronDown size={12} />
                                Show {comment.replies.length} replies
                              </>
                            )}
                          </button>

                          {expandedComments.has(comment.id) && (
                            <div className="replies-list">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="reply-item">
                                  <div className="comment-avatar small">
                                    <img
                                      src={reply.user.avatar || "/placeholder.svg"}
                                      alt={reply.user.username}
                                    />
                                  </div>
                                  <div className="comment-content">
                                    <div className="comment-header">
                                      <span className="comment-username">
                                        @{reply.user.username}
                                      </span>
                                      <span className="comment-timestamp">{reply.timestamp}</span>
                                    </div>
                                    <p className="comment-text">{reply.content}</p>
                                    <div className="comment-actions">
                                      <button
                                        className={`comment-action ${reply.isLiked ? "liked" : ""}`}
                                      >
                                        <ThumbsUp size={12} />
                                        <span>{reply.likes}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
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
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          border: 2px solid rgba(139, 92, 246, 0.3);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .username {
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .timestamp {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #8b949e;
          font-size: 0.75rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-button,
        .close-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #8b949e;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover,
        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .more-actions-dropdown {
          position: absolute;
          top: 4rem;
          right: 1.5rem;
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.5rem;
          z-index: 10;
          min-width: 150px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem;
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-content {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        .video-section {
          flex: 2;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .video-container {
          position: relative;
          flex: 1;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .video-player {
          width: 100%;
          height: 100%;
          object-fit: contain;
          cursor: pointer;
        }

        .video-controls {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .video-container:hover .video-controls {
          opacity: 1;
        }

        .control-button {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 0.75rem;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-button:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .control-button.play-pause {
          padding: 1rem;
        }

        .video-stats-overlay {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          color: #ffffff;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .video-info {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .video-title {
          margin: 0 0 0.5rem 0;
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .video-description {
          margin: 0 0 1rem 0;
          color: #8b949e;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .action-btn.liked {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }

        .action-btn.saved {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
          color: #8b5cf6;
        }

        .comments-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          min-width: 350px;
          max-height: 100%;
        }

        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .comments-header h4 {
          margin: 0;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
        }

        .toggle-comments {
          background: none;
          border: none;
          color: #8b949e;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .toggle-comments:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .add-comment {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          flex-shrink: 0;
          overflow: hidden;
        }

        .comment-avatar.small {
          width: 24px;
          height: 24px;
        }

        .comment-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .comment-input-container {
          flex: 1;
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .comment-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 0.75rem 1rem;
          color: #ffffff;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .comment-input.small {
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
        }

        .comment-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .comment-input::placeholder {
          color: #8b949e;
        }

        .send-button {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 0.75rem;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-button.small {
          padding: 0.5rem;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .comments-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem 0;
        }

        .comments-list::-webkit-scrollbar {
          width: 6px;
        }

        .comments-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .comments-list::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        .comment-item {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          transition: all 0.2s ease;
        }

        .comment-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .comment-content {
          flex: 1;
          min-width: 0;
        }

        .comment-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .comment-username {
          color: #ffffff;
          font-weight: 500;
          font-size: 0.85rem;
        }

        .verified-badge {
          color: #3b82f6;
          font-size: 0.7rem;
        }

        .comment-timestamp {
          color: #8b949e;
          font-size: 0.75rem;
        }

        .comment-text {
          margin: 0 0 0.5rem 0;
          color: #ffffff;
          font-size: 0.9rem;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .comment-actions {
          display: flex;
          gap: 1rem;
        }

        .comment-action {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          color: #8b949e;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 0.75rem;
        }

        .comment-action:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .comment-action.liked {
          color: #3b82f6;
        }

        .reply-input {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
          align-items: center;
        }

        .replies-section {
          margin-top: 0.75rem;
          padding-left: 1rem;
          border-left: 2px solid rgba(255, 255, 255, 0.1);
        }

        .show-replies {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          color: #8b5cf6;
          cursor: pointer;
          padding: 0.5rem 0;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .show-replies:hover {
          color: #a78bfa;
        }

        .replies-list {
          margin-top: 0.5rem;
        }

        .reply-item {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .reply-item:last-child {
          border-bottom: none;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .modal-container {
            max-width: 95vw;
            max-height: 95vh;
          }

          .modal-content {
            flex-direction: column;
          }

          .video-section {
            flex: none;
          }

          .video-container {
            min-height: 300px;
          }

          .comments-section {
            min-width: unset;
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 300px;
          }

          .action-buttons {
            justify-content: center;
          }

          .action-btn {
            flex: 1;
            justify-content: center;
            min-width: 0;
          }
        }

        @media (max-width: 480px) {
          .modal-overlay {
            padding: 0.5rem;
          }

          .modal-header {
            padding: 0.75rem 1rem;
          }

          .video-info {
            padding: 1rem;
          }

          .add-comment {
            padding: 0.75rem 1rem;
          }

          .comment-item {
            padding: 0.75rem 1rem;
          }

          .action-buttons {
            gap: 0.5rem;
          }

          .action-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};
