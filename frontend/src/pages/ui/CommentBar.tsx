import type React from "react"
import { useState, useEffect } from "react"
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  MessageSquareOff,
  MessageSquarePlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useComments } from "../../hooks/useComments"
import type {
  Comment,
  CreateCommentRequest,
  CreateCommentResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
} from "../../api/gen/comment"
import { useAuth } from "../../utils/AuthProvider"
import { commentClient } from "../../api/grpc/commentClient"
import type { LikeCommentRequest, UnlikeCommentRequest } from "../../api/gen/like_comment"
import { likeCommentClient } from "../../api/grpc/likeCommentClient"
import { avatarBytesToUrl } from "../../utils/avatarConverter"
import defaultAvatar from "../../assets/default.jpg"

interface Props {
  videoId: number
  onClose?: () => void
  canComment: boolean
}

const CommentBar: React.FC<Props> = ({ videoId, onClose, canComment }) => {
  const { user, getAuthMetadata } = useAuth();
  const { comments: initialComments, loading, error, refetch } = useComments(user ? Number(user.id) : 0, videoId)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({})
  const [errorMessage, setErrorMessage] = useState("")
  const [replyInputs, setReplyInputs] = useState<{ [key: number]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset and update comments when videoId changes or when new comments are fetched
  useEffect(() => {
    if (initialComments.length > 0) {
      setComments(
        initialComments.map((c) => ({
          ...c,
          id: typeof c.id === "number" ? String(c.id) : c.id,
          userId: typeof c.userId === "number" ? String(c.userId) : c.userId,
          videoId: typeof c.videoId === "number" ? String(c.videoId) : c.videoId,
        })),
      )
    } else {
      setComments([])
    }
  }, [initialComments, videoId])

  // Reset UI state when videoId changes
  useEffect(() => {
    setShowReplies({})
    setNewComment("")
    setReplyInputs({})
    setErrorMessage("")
  }, [videoId])

  const handleLike = async (commentId: number) => {
    try {
      setErrorMessage("")
      if (!user) {
        setErrorMessage("User is not authenticated.")
        return
      }

      const req: LikeCommentRequest = {
        commentId,
        userId: Number(user.id),
      }

      const response = await likeCommentClient.LikeComment(req)
      if (response) {
        await refetch()
      } else {
        setErrorMessage("Failed to like comment.")
      }
    } catch (error: any) {
      console.error("Error liking comment:", error)
      setErrorMessage(error?.message || "An unexpected error occurred.")
    }
  }

  const handleUnlike = async (commentId: number) => {
    try {
      setErrorMessage("")
      if (!user) {
        setErrorMessage("User is not authenticated.")
        return
      }

      const req: UnlikeCommentRequest = {
        commentId,
        userId: Number(user.id),
      }

      const response = await likeCommentClient.UnlikeComment(req)
      if (response) {
        await refetch()
      } else {
        setErrorMessage("Failed to unlike comment.")
      }
    } catch (error: any) {
      console.error("Error unliking comment:", error)
      setErrorMessage(error?.message || "An unexpected error occurred.")
    }
  }

  const handleAddComment = async (replyToId = 0) => {
    try {
      setErrorMessage("")
      setIsSubmitting(true)

      const content = replyToId === 0 ? newComment : replyInputs[replyToId] || ""

      if (!content.trim()) {
        setErrorMessage("Comment cannot be empty.")
        return
      }

      if (!user) {
        setErrorMessage("User is not authenticated.")
        return
      }

      const request: CreateCommentRequest = {
        userId: Number(user.id),
        videoId: videoId,
        content: content.trim(),
        replyToId: replyToId,
      }

      const response: CreateCommentResponse = await commentClient.CreateComment(request, getAuthMetadata())

      console.log("response:", response)
      if (response?.comment) {
        await refetch()
        if (replyToId === 0) {
          setNewComment("")
        } else {
          setReplyInputs((prev) => ({ ...prev, [replyToId]: "" }))
        }
      } else {
        setErrorMessage("Failed to post comment. Please try again.")
      }
    } catch (error: any) {
      console.error("CreateComment error:", error)
      setErrorMessage(error?.message || "Failed to post comment. Please check your connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleReplies = (commentId: number) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const handleReplyInputChange = (commentId: number, value: string) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: value,
    }))
  }

  const handleDelete = async (commentId: number) => {
    try {
      if (!user) {
        setErrorMessage("User is not authenticated.")
        return
      }

      const req: DeleteCommentRequest = {
        id: commentId.toString(),
      }
      const res: DeleteCommentResponse = await commentClient.DeleteComment(req, getAuthMetadata())
      if (res && res.success) {
        setErrorMessage("")
        await refetch()
      } else {
        setErrorMessage("Failed to delete comment.")
      }
    } catch (error: any) {
      console.error("DeleteComment error:", error)
      setErrorMessage(error?.message || "Failed to delete comment.")
    }
  }

  return (
    <div className="comment-bar">
      {/* Header */}
      <div className="comment-header">
        <div className="header-content">
          <MessageCircle size={20} className="header-icon" />
          <span className="header-title">Comments {canComment ? `(${comments.length})` : ""}</span>
        </div>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      {!canComment ? (
        <div className="disabled-state">
          <MessageSquareOff size={48} className="disabled-icon" />
          <h3 className="disabled-title">Comments are disabled</h3>
          <p className="disabled-description">The creator has disabled comments for this video.</p>
        </div>
      ) : (
        <div className="comment-content">
          {/* Comments List */}
          <div className="comments-list">
            {loading ? (
              <div className="loading-state">
                <Loader2 size={24} className="loading-spinner" />
                <p className="loading-text">Loading comments...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p className="error-title">Error loading comments</p>
                <p className="error-description">Please try again later</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="empty-state">
                <MessageSquarePlus size={32} className="empty-icon" />
                <p className="empty-title">Be the first to comment!</p>
                <p className="empty-description">Share your thoughts about this video</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-main">
                    <div className="comment-avatar">
                      <img
                        src={
                          comment.user && comment.user.avatar
                            ? (avatarBytesToUrl(comment.user.avatar) ?? defaultAvatar)
                            : defaultAvatar
                        }
                        alt={comment.user?.username || "User Avatar"}
                        className="avatar-image"
                      />
                    </div>

                    <div className="comment-body">
                      <div className="comment-header-row">
                        <span className="comment-username">
                          {comment.user?.username ? comment.user.username : "user" + comment.userId}
                        </span>
                        {user && String(user.id) === comment.userId && (
                          <button
                            onClick={() => handleDelete(Number(comment.id))}
                            className="delete-button"
                            title="Delete comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <p className="comment-text">{comment.content}</p>

                      <div className="comment-actions">
                        <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() =>
                            !comment.isLiked ? handleLike(Number(comment.id)) : handleUnlike(Number(comment.id))
                          }
                          className={`action-button like-button ${comment.isLiked ? "liked" : ""}`}
                        >
                          <Heart size={14} className={comment.isLiked ? "filled" : ""} />
                          <span>{comment.likeCount}</span>
                        </button>
                        <button
                          onClick={() => toggleReplies(Number(comment.id))}
                          className="action-button reply-button"
                        >
                          <MessageCircle size={14} />
                          <span>Reply ({comment.replies?.length || 0})</span>
                          {showReplies[Number(comment.id)] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {/* Replies Section */}
                      {showReplies[Number(comment.id)] && (
                        <div className="replies-section">
                          {comment.replies && comment.replies.length > 0 ? (
                            comment.replies.map((reply: Comment) => (
                              <div key={reply.id} className="reply-item">
                                <div className="reply-avatar">
                                  <img
                                    src={
                                      reply.user?.avatar
                                        ? avatarBytesToUrl(reply.user.avatar) || defaultAvatar
                                        : defaultAvatar
                                    }
                                    alt={reply.user?.username || "User Avatar"}
                                    className="avatar-image"
                                  />
                                </div>
                                <div className="reply-body">
                                  <div className="reply-header">
                                    <span className="reply-username">{reply.user?.username || "Unknown"}</span>
                                    <span className="reply-content">{reply.content}</span>
                                  </div>
                                  <div className="reply-actions">
                                    <span className="reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                    <button
                                      onClick={() =>
                                        !reply.isLiked ? handleLike(Number(reply.id)) : handleUnlike(Number(reply.id))
                                      }
                                      className={`action-button like-button small ${reply.isLiked ? "liked" : ""}`}
                                    >
                                      <Heart size={12} className={reply.isLiked ? "filled" : ""} />
                                      <span>{reply.likeCount || 0}</span>
                                    </button>
                                  </div>
                                </div>
                                {user && String(user.id) === reply.userId && (
                                  <button
                                    onClick={() => handleDelete(Number(reply.id))}
                                    className="delete-button small"
                                    title="Delete reply"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="no-replies">No replies yet</div>
                          )}

                          {/* Reply Input */}
                          <div className="reply-input-section">
                            <div className="reply-input-container">
                              <textarea
                                placeholder="Write a reply..."
                                value={replyInputs[Number(comment.id)] || ""}
                                onChange={(e) => handleReplyInputChange(Number(comment.id), e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAddComment(Number(comment.id))
                                  }
                                }}
                                rows={1}
                                className="reply-textarea"
                              />
                              <button
                                onClick={() => handleAddComment(Number(comment.id))}
                                disabled={!replyInputs[Number(comment.id)]?.trim() || isSubmitting}
                                className="reply-send-button"
                              >
                                {isSubmitting ? <Loader2 size={14} className="loading-spinner" /> : <Send size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="comment-input-section">
            <div className="comment-input-container">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add comment..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment()
                  }
                }}
                className="comment-textarea"
              />
              <button
                onClick={() => handleAddComment()}
                disabled={!newComment.trim() || isSubmitting}
                className="comment-send-button"
              >
                {isSubmitting ? <Loader2 size={16} className="loading-spinner" /> : <Send size={16} />}
              </button>
            </div>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </div>
        </div>
      )}

      <style>{`
        .comment-bar {
          width: 380px;
          height: 100vh;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon {
          color: #3b82f6;
        }

        .header-title {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
        }

        .close-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #9ca3af;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .disabled-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
        }

        .disabled-icon {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .disabled-title {
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .disabled-description {
          color: #9ca3af;
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .comment-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .comments-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          scroll-behavior: smooth;
        }

        .comments-list::-webkit-scrollbar {
          width: 6px;
        }

        .comments-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .comments-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .comments-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          gap: 0.75rem;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          color: #3b82f6;
        }

        .loading-text {
          color: #9ca3af;
          margin: 0;
          font-size: 0.9rem;
        }

        .error-state {
          text-align: center;
          padding: 2rem 1rem;
        }

        .error-title {
          color: #ef4444;
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .error-description {
          color: #9ca3af;
          margin: 0;
          font-size: 0.85rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
        }

        .empty-icon {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .empty-title {
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .empty-description {
          color: #9ca3af;
          margin: 0;
          font-size: 0.85rem;
        }

        .comment-item {
          margin-bottom: 1.5rem;
        }

        .comment-main {
          display: flex;
          gap: 0.75rem;
        }

        .comment-avatar {
          flex-shrink: 0;
        }

        .avatar-image {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .comment-body {
          flex: 1;
          min-width: 0;
        }

        .comment-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .comment-username {
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .delete-button {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-button:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .delete-button.small {
          padding: 0.125rem;
        }

        .comment-text {
          color: #e5e7eb;
          font-size: 0.9rem;
          line-height: 1.4;
          margin: 0 0 0.75rem 0;
          word-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .comment-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .comment-date {
          color: #9ca3af;
          font-size: 0.75rem;
        }

        .action-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }

        .action-button.small {
          font-size: 0.7rem;
          gap: 0.25rem;
          padding: 0.125rem 0.375rem;
        }

        .like-button.liked {
          color: #ef4444;
        }

        .like-button.liked .filled {
          fill: currentColor;
        }

        .replies-section {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .reply-item {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-left: 0.75rem;
          border-left: 2px solid rgba(59, 130, 246, 0.3);
        }

        .reply-item:last-of-type {
          margin-bottom: 0;
        }

        .reply-avatar .avatar-image {
          width: 28px;
          height: 28px;
        }

        .reply-body {
          flex: 1;
          min-width: 0;
        }

        .reply-header {
          margin-bottom: 0.375rem;
        }

        .reply-username {
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 600;
          margin-right: 0.5rem;
        }

        .reply-content {
          color: #d1d5db;
          font-size: 0.8rem;
          line-height: 1.3;
        }

        .reply-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .reply-date {
          color: #9ca3af;
          font-size: 0.7rem;
        }

        .no-replies {
          color: #6b7280;
          font-size: 0.8rem;
          text-align: center;
          padding: 1rem;
          font-style: italic;
        }

        .reply-input-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .reply-input-container {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .reply-textarea {
          flex: 1;
          resize: none;
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.8rem;
          outline: none;
          max-height: 60px;
          overflow-y: auto;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .reply-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .reply-textarea::placeholder {
          color: #9ca3af;
        }

        .reply-send-button {
          background: #3b82f6;
          border: none;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .reply-send-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .reply-send-button:disabled {
          background: #374151;
          cursor: not-allowed;
          transform: none;
        }

        .comment-input-section {
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .comment-input-container {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
        }

        .comment-textarea {
          flex: 1;
          resize: none;
          padding: 0.75rem 1rem;
          border-radius: 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.9rem;
          outline: none;
          max-height: 80px;
          overflow-y: auto;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .comment-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .comment-textarea::placeholder {
          color: #9ca3af;
        }

        .comment-send-button {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 1.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .comment-send-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }

        .comment-send-button:disabled {
          background: #374151;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          padding-left: 0.25rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .comment-bar {
            width: 100vw;
          }
        }
      `}</style>
    </div>
  )
}

export default CommentBar
