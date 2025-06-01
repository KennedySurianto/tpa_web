import React, { useState, useEffect } from 'react';
import { useComments } from '../../../hooks/useComments';
import { Comment } from '../../../api/gen/activity';
import { createComment } from '../../../services/commentApi';

interface Props {
  videoId: number;
  onClose?: () => void;
}

const CommentBar: React.FC<Props> = ({ videoId, onClose }) => {
  const { comments: initialComments, loading, error } = useComments(videoId);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});
  const [likedComments, setLikedComments] = useState<Record<number, boolean>>({});
  const [errorMessage, setErrorMessage] = useState('');

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
    setLikedComments({});
    setNewComment('');
  }, [videoId]);

  const handleLike = (commentId: number) => {
    setLikedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleAddComment = async () => {

    try {
      setErrorMessage(''); // Clear previous errors

      const response = await createComment(videoId, newComment);

      if (response?.comment) {
        const savedComment = {
          ...response.comment,
          id: String(response.comment.id),
          userId: String(response.comment.userId),
          videoId: String(response.comment.videoId),
        };

        setComments(prev => [...prev, savedComment]);
        setNewComment('');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
        console.error('CreateComment returned no comment.');
      }
    } catch (error) {
      setErrorMessage('Failed to post comment. Please check your connection.');
      console.error('CreateComment error:', error);
    }
  };

  const toggleReplies = (commentId: number) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <div style={{
      width: '350px',
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
          <span style={{ 
            fontSize: '12px', 
            color: '#8a8a8a',
            backgroundColor: '#2f2f2f',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            Video #{videoId}
          </span>
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
                        onClick={() => handleLike(Number(comment.id))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: likedComments[Number(comment.id)] ? '#ff0050' : '#8a8a8a',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '2px',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        ♥ {likedComments[Number(comment.id)] ? 1 : 0}
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
                        Reply
                      </button>
                    </div>

                    {showReplies[Number(comment.id)] && (
                      <div style={{ 
                        color: '#8a8a8a', 
                        fontSize: '12px', 
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                      }}>
                        (Replies not yet implemented)
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
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              style={{
                background: newComment.trim() ? '#ff0050' : '#2f2f2f',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                padding: '8px 12px',
                transition: 'background 0.2s ease',
              }}
            >
              Post
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