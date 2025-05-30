import React, { useState } from 'react';

// interface CommentSidebarProps {
//   videoId: number;
// }

const CommentSidebar: React.FC = () => {


  const [comments, setComments] = useState([
    {
      id: 1,
      user: 'Jin',
      avatar: '👤',
      text: 'anime name: clannad',
      time: '2-18',
      likes: 71,
      replies: 25,
      isLiked: false
    },
    {
      id: 2,
      user: 'EL',
      avatar: '👤',
      text: 'anime apa ni vibes mcnya sama kaya okazaki tomoya dari clannad jir',
      time: '3-2',
      likes: 0,
      replies: 2,
      isLiked: false
    },
    {
      id: 3,
      user: 'Septi',
      avatar: '👤',
      text: 'kayak gua bgt lagi 😭',
      time: '2-17',
      likes: 80,
      replies: 11,
      isLiked: false
    },
    {
      id: 4,
      user: 'OKINAWA-<3',
      avatar: '👤',
      text: 'anime name bro',
      time: '2-17',
      likes: 23,
      replies: 3,
      isLiked: false
    },
    {
      id: 5,
      user: 'Kenshiro',
      avatar: '👤',
      text: 'anime apa ni',
      time: '2-19',
      likes: 0,
      replies: 4,
      isLiked: false
    },
    {
      id: 6,
      user: 'YUU',
      avatar: '👤',
      text: 'Bangun, sekolah, pulang, tidur gitu aja terus siklus nya😭',
      time: '2-19',
      likes: 8,
      replies: 6,
      isLiked: false
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});

  const handleLike = (commentId: number) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          }
        : comment
    ));
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: comments.length + 1,
        user: 'You',
        avatar: '👤',
        text: newComment,
        time: 'now',
        likes: 0,
        replies: 0,
        isLiked: false
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
    }
  };

  const toggleReplies = (commentId: number) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div className="d-flex align-center justify-between p-3" style={{
        borderBottom: '1px solid #2f2f2f',
        color: 'white'
      }}>
        <div className="d-flex align-center">
          <span style={{ fontSize: '16px', fontWeight: '600' }}>Comments (311)</span>
        </div>
        <button style={{
          background: 'none',
          border: 'none',
          color: '#8a8a8a',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '4px'
        }}>
          ✕
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-grow-1" style={{
        overflowY: 'auto',
        padding: '12px'
      }}>
        {comments.map((comment) => (
          <div key={comment.id} className="mb-3">
            <div className="d-flex" style={{ gap: '10px' }}>
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#8a8a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: '0'
              }}>
                {comment.avatar}
              </div>

              {/* Comment Content */}
              <div className="flex-grow-1">
                <div className="d-flex align-center justify-between mb-1">
                  <span style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {comment.user}
                  </span>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: '#8a8a8a',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '2px'
                  }}>
                    ⋯
                  </button>
                </div>

                <p style={{
                  color: 'white',
                  fontSize: '14px',
                  margin: '0 0 8px 0',
                  lineHeight: '1.4'
                }}>
                  {comment.text}
                </p>

                <div className="d-flex align-center" style={{ gap: '16px' }}>
                  <span style={{
                    color: '#8a8a8a',
                    fontSize: '12px'
                  }}>
                    {comment.time}
                  </span>

                  <button 
                    onClick={() => handleLike(comment.id)}
                    className="d-flex align-center"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: comment.isLiked ? '#ff0050' : '#8a8a8a',
                      fontSize: '12px',
                      cursor: 'pointer',
                      gap: '4px',
                      padding: '2px'
                    }}
                  >
                    ♥ {comment.likes}
                  </button>

                  {comment.replies > 0 && (
                    <button 
                      onClick={() => toggleReplies(comment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8a8a8a',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                    >
                      Reply
                    </button>
                  )}
                </div>

                {comment.replies > 0 && (
                  <button 
                    onClick={() => toggleReplies(comment.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8a8a8a',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '4px 0',
                      textDecoration: 'underline'
                    }}
                  >
                    View {comment.replies} replies {showReplies[comment.id] ? '▲' : '▼'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Input */}
      <div className="p-3" style={{
        borderTop: '1px solid #2f2f2f',
        backgroundColor: '#161823'
      }}>
        <div className="d-flex align-center" style={{ gap: '8px' }}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add comment..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            style={{
              flex: '1',
              backgroundColor: '#2f2f2f',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 16px',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button style={{
            background: 'none',
            border: 'none',
            color: '#8a8a8a',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '6px'
          }}>
            😊
          </button>
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
              padding: '8px 12px'
            }}
          >
            Post
          </button>
        </div>
      </div>

      <style>{`
        /* Custom scrollbar for comment area */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: #161823;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #2f2f2f;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }

        /* Responsive behavior */
        @media (max-width: 768px) {
          .comment-sidebar {
            width: 100vw !important;
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            z-index: 1000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CommentSidebar;