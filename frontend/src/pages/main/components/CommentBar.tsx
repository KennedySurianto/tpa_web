import React, { useState, useEffect } from 'react';
import { useComments } from '../../../hooks/useComments';
import { Comment, CreateCommentRequest, CreateCommentResponse } from '../../../api/gen/comment';
import { useAuth } from '../../../utils/AuthProvider';
import { commentClient } from '../../../api/grpc/commentClient';
import type { LikeCommentRequest, UnlikeCommentRequest } from '../../../api/gen/like_comment';
import { likeCommentClient } from '../../../api/grpc/likeCommentClient';

interface Props {
  videoId: number;
  onClose?: () => void;
}

const CommentBar: React.FC<Props> = ({ videoId, onClose }) => {
  const user = useAuth().user;
  const { comments: initialComments, loading, error, refetch } = useComments(user ? Number(user.id) : 0, videoId);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [replyInputs, setReplyInputs] = useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset and update comments when videoId changes or when new comments are fetched
  useEffect(() => {
    if (initialComments.length > 0) {
      setComments(
        initialComments.map((c) => ({
          ...c,
          id: typeof c.id === 'number' ? String(c.id) : c.id,
          userId: typeof c.userId === 'number' ? String(c.userId) : c.userId,
          videoId: typeof c.videoId === 'number' ? String(c.videoId) : c.videoId,
        }))
      );
    } else {
      // Clear comments if no comments for this video
      setComments([]);
    }
  }, [initialComments, videoId]);

  // Reset UI state when videoId changes
  useEffect(() => {
    setShowReplies({});
    setNewComment('');
    setReplyInputs({});
    setErrorMessage('');
  }, [videoId]);

  const handleLike = async (commentId: number) => {
    try {
      setErrorMessage('');

      if (!user) {
        setErrorMessage('User is not authenticated.');
        return;
      }

      const req: LikeCommentRequest = {
        commentId,
        userId: Number(user.id),
      };

      const response = await likeCommentClient.LikeComment(req);

      if (response) {
        await refetch();
      } else {
        setErrorMessage('Failed to like comment.');
      }

    } catch (error: any) {
      console.error('Error liking comment:', error);
      setErrorMessage(error?.message || 'An unexpected error occurred.');
    }
  };

  const handleUnlike = async (commentId: number) => {
    try {
      setErrorMessage('');

      if (!user) {
        setErrorMessage('User is not authenticated.');
        return;
      }

      const req: UnlikeCommentRequest = {
        commentId,
        userId: Number(user.id),
      };

      const response = await likeCommentClient.UnlikeComment(req);

      if (response) {
        await refetch();
      } else {
        setErrorMessage('Failed to unlike comment.');
      }

    } catch (error: any) {
      console.error('Error unliking comment:', error);
      setErrorMessage(error?.message || 'An unexpected error occurred.');
    }
  };

  const handleAddComment = async (replyToId: number = 0) => {
    try {
      setErrorMessage('');
      setIsSubmitting(true);

      const content = replyToId === 0 ? newComment : replyInputs[replyToId] || '';

      if (!content.trim()) {
        setErrorMessage('Comment cannot be empty.');
        return;
      }

      if (!user) {
        setErrorMessage('User is not authenticated.');
        return;
      }

      const request: CreateCommentRequest = {
        userId: Number(user.id),
        videoId: videoId,
        content: content.trim(),
        replyToId: replyToId,
      };
      
      const response: CreateCommentResponse = await commentClient.CreateComment(request);
      
      console.log('response:', response);

      if (response?.comment) {
        await refetch();
        if (replyToId === 0) {
          setNewComment('');
        } else {
          setReplyInputs(prev => ({ ...prev, [replyToId]: '' }));
        }
      } else {
        setErrorMessage('Failed to post comment. Please try again.');
      }
    } catch (error: any) {
      console.error('CreateComment error:', error);
      setErrorMessage(error?.message || 'Failed to post comment. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplies = (commentId: number) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleReplyInputChange = (commentId: number, value: string) => {
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: value
    }));
  };

  return (
    <div style={{
      width: '350px',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      overflowX: 'hidden',
      height: '100vh',
      backgroundColor: '#161823',
      borderLeft: '1px solid #2f2f2f',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #2f2f2f',
        color: 'white',
        padding: '12px 16px',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 600,
        backgroundColor: '#161823',
      }}>
        <span>Comments ({comments.length})</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8a8a8a',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = 'white')}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.color = '#8a8a8a'}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Comments List - Scrollable Container */}
      <div style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // Important for flex child to be scrollable
      }}>
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '12px',
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              gap: '8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid #2f2f2f',
                borderTop: '2px solid #ff0050',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}></div>
              <p style={{ color: '#8a8a8a', textAlign: 'center', margin: 0 }}>Loading comments...</p>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center',
              padding: '20px',
              color: '#ff4d4f'
            }}>
              <p>Error loading comments</p>
              <p style={{ fontSize: '12px', color: '#8a8a8a' }}>Please try again later</p>
            </div>
          ) : comments.length === 0 ? (
            <div style={{ 
              textAlign: 'center',
              padding: '40px 20px',
              color: '#8a8a8a'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
              <p style={{ margin: 0, fontSize: '14px' }}>Be the first to comment!</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Share your thoughts about this video</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#8a8a8a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>
                    {comment.user?.profileUrl ? (
                      <img
                        src={comment.user.profileUrl}
                        alt={comment.user.username || 'User Avatar'}
                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      />
                    ) : (
                      <span style={{ color: 'white' }}>
                        👤
                      </span>
                    )}
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                      <span style={{
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}>
                        {comment.user?.username ? comment.user.username : 'user' + comment.userId}
                      </span>
                      <button style={{
                        background: 'none',
                        border: 'none',
                        color: '#8a8a8a',
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '2px',
                      }}>
                        ⋯
                      </button>
                    </div>

                    <p style={{
                      color: 'white',
                      fontSize: '14px',
                      margin: '0 0 8px 0',
                      lineHeight: 1.4,
                    }}>
                      {comment.content}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ color: '#8a8a8a', fontSize: '12px' }}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => !comment.isLiked ? handleLike(Number(comment.id)) : handleUnlike(Number(comment.id))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: comment.isLiked ? '#ff0050' : '#8a8a8a',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '2px',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        ♥ {comment.likeCount}
                      </button>

                      <button
                        onClick={() => toggleReplies(Number(comment.id))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#8a8a8a',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '2px',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        Reply ({comment.replies?.length || 0})
                      </button>
                    </div>

                    {showReplies[Number(comment.id)] && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px'
                      }}>
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 ? (
                          comment.replies.map((reply: Comment) => (
                            <div key={reply.id} style={{ 
                              marginBottom: '12px', 
                              paddingLeft: '12px', 
                              borderLeft: '2px solid #444',
                              display: 'flex',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                flexShrink: 0,
                              }}>
                                {reply.user?.profileUrl ? (
                                  <img
                                    src={reply.user.profileUrl}
                                    alt={reply.user.username || 'User Avatar'}
                                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                  />
                                ) : (
                                  <span style={{ color: 'white' }}>👤</span>
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  color: '#ccc', 
                                  fontSize: '13px',
                                  marginBottom: '4px'
                                }}>
                                  <strong style={{ color: 'white' }}>
                                    {reply.user?.username || 'Unknown'}
                                  </strong>
                                  <span style={{ marginLeft: '8px' }}>{reply.content}</span>
                                </div>
                                <div style={{ 
                                  fontSize: '11px', 
                                  color: '#888',
                                  display: 'flex',
                                  gap: '12px',
                                  alignItems: 'center'
                                }}>
                                  <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  <button
                                    onClick={() => !reply.isLiked ? handleLike(Number(reply.id)) : handleUnlike(Number(reply.id))}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: reply.isLiked ? '#ff0050' : '#8a8a8a',
                                      fontSize: '11px',
                                      cursor: 'pointer',
                                      padding: '2px',
                                      transition: 'color 0.2s ease',
                                    }}
                                  >
                                    ♥ {reply.likeCount || 0}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ 
                            color: '#888', 
                            fontSize: '12px',
                            textAlign: 'center',
                            padding: '8px'
                          }}>
                            No replies yet
                          </div>
                        )}

                        {/* Reply input */}
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                            <textarea
                              placeholder="Write a reply..."
                              value={replyInputs[Number(comment.id)] || ''}
                              onChange={(e) => handleReplyInputChange(Number(comment.id), e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(Number(comment.id));
                                }
                              }}
                              rows={1}
                              style={{ 
                                flex: 1,
                                resize: 'none',
                                padding: '8px 12px', 
                                borderRadius: '16px', 
                                backgroundColor: '#333', 
                                color: '#fff', 
                                border: '1px solid #555',
                                fontSize: '13px',
                                outline: 'none',
                                maxHeight: '60px',
                                overflowY: 'auto'
                              }}
                            />
                            <button
                              onClick={() => handleAddComment(Number(comment.id))}
                              disabled={!replyInputs[Number(comment.id)]?.trim() || isSubmitting}
                              style={{ 
                                padding: '8px 16px', 
                                backgroundColor: replyInputs[Number(comment.id)]?.trim() && !isSubmitting ? '#ff0050' : '#444',
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '16px', 
                                cursor: replyInputs[Number(comment.id)]?.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'background 0.2s ease',
                                flexShrink: 0
                              }}
                            >
                              {isSubmitting ? '...' : 'Reply'}
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

        {/* Input Box - Now at bottom of comments container */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#161823',
          borderTop: '1px solid #2f2f2f',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add comment..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              style={{
                flex: 1,
                resize: 'none',
                borderRadius: '20px',
                border: 'none',
                padding: '10px 16px',
                fontSize: '14px',
                color: 'white',
                backgroundColor: '#2f2f2f',
                outline: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                maxHeight: '80px',
                overflowY: 'auto',
              }}
            />
            <button
              onClick={() => handleAddComment()}
              disabled={!newComment.trim() || isSubmitting}
              style={{
                background: newComment.trim() && !isSubmitting ? '#ff0050' : '#2f2f2f',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: newComment.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                padding: '8px 12px',
                transition: 'background 0.2s ease',
              }}
            >
              {isSubmitting ? '...' : 'Post'}
            </button>
          </div>
          {errorMessage && (
            <div style={{ color: '#ff4d4f', fontSize: '12px', paddingLeft: '4px' }}>
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CommentBar;