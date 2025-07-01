import type React from "react"

import { useEffect, useState } from "react"
import type { FollowRequest } from "../api/gen/follow"
import { followClient } from "../api/grpc/followClient"
import { useNavigate } from "react-router-dom"
import type { User } from "../api/gen/user"
import { useAuth } from "../utils/AuthProvider"
import defaultAvatar from "../assets/default.jpg"
import { avatarBytesToUrl } from "../utils/avatarConverter"
import { CheckCircle, Users, UserPlus, UserMinus } from "lucide-react"

export const UserCard: React.FC<{ user: User; currentUserId: number }> = ({ user }) => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [isFollowed, setIsFollowed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)

  useEffect(() => {
    const checkFollowAndCount = async () => {
      if (currentUser?.id) {
        try {
          const res = await followClient.GetFollowers({ userId: Number(user.id) })
          setIsFollowed(res.follows.some((f) => Number(f.followerId) === Number(currentUser.id)))
          setFollowerCount(res.follows.length)
        } catch (err) {
          console.error("Error checking follow:", err)
        }
      }
    }

    checkFollowAndCount()
  }, [currentUser?.id, user.id])

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser) return

    setLoading(true)
    const req: FollowRequest = {
      followerId: Number(currentUser.id),
      followedId: Number(user.id),
    }

    try {
      if (isFollowed) {
        await followClient.Unfollow(req)
        setIsFollowed(false)
        setFollowerCount((prevCount) => Math.max(0, prevCount - 1))
      } else {
        await followClient.Follow(req)
        setIsFollowed(true)
        setFollowerCount((prevCount) => prevCount + 1)
      }
    } catch (err) {
      console.error("Follow/unfollow error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="user-card" onClick={() => navigate(`/${user.username}`)}>
      <div className="user-avatar-wrapper">
        <img src={avatarBytesToUrl(user.avatar) || defaultAvatar} alt={user.username} className="user-avatar" />
        {user.isVerified && (
          <div className="verification-badge">
            <CheckCircle size={14} />
          </div>
        )}
      </div>

      <div className="user-info">
        <div className="user-header">
          <span className="username">@{user.username}</span>
          <span className="display-name">{user.displayName}</span>
        </div>
        {user.bio && <div className="user-bio">{user.bio}</div>}
        <div className="follower-count">
          <Users size={14} />
          <span>{followerCount} followers</span>
        </div>
      </div>

      <div className="user-actions">
        {currentUser?.id !== user.id && (
          <button
            className={`follow-btn ${isFollowed ? "following" : "not-following"}`}
            onClick={handleToggleFollow}
            disabled={loading}
          >
            {loading ? (
              <div className="btn-spinner"></div>
            ) : isFollowed ? (
              <>
                <UserMinus size={16} />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Follow
              </>
            )}
          </button>
        )}
      </div>

      <style>{`
        .user-card {
          display: flex;
          align-items: center;
          padding: 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          gap: 16px;
          margin-bottom: 12px;
        }

        .user-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .user-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .user-avatar {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: border-color 0.3s ease;
        }

        .user-card:hover .user-avatar {
          border-color: rgba(139, 92, 246, 0.5);
        }

        .verification-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #8b5cf6;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0a0a0a;
          color: white;
        }

        .user-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .user-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .username {
          font-weight: 700;
          font-size: 1rem;
          color: #ffffff;
        }

        .display-name {
          font-weight: 500;
          font-size: 0.9rem;
          color: #8b949e;
        }

        .user-bio {
          font-size: 0.85rem;
          color: #8b949e;
          line-height: 1.4;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          text-overflow: ellipsis;
        }

        .follower-count {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #3b82f6;
          font-weight: 500;
        }

        .user-actions {
          flex-shrink: 0;
        }

        .follow-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          min-width: 100px;
          justify-content: center;
          position: relative;
        }

        .follow-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .follow-btn.not-following {
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          color: white;
        }

        .follow-btn.not-following:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }

        .follow-btn.following {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .follow-btn.following:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.2);
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .user-card {
            padding: 12px;
            gap: 12px;
          }

          .user-avatar {
            width: 48px;
            height: 48px;
          }

          .verification-badge {
            width: 18px;
            height: 18px;
          }

          .username {
            font-size: 0.9rem;
          }

          .display-name {
            font-size: 0.8rem;
          }

          .user-bio {
            font-size: 0.8rem;
          }

          .follower-count {
            font-size: 0.75rem;
          }

          .follow-btn {
            padding: 6px 12px;
            font-size: 0.8rem;
            min-width: 80px;
          }
        }

        @media (max-width: 480px) {
          .user-card {
            padding: 10px;
            gap: 10px;
          }

          .user-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }

          .user-avatar {
            width: 44px;
            height: 44px;
          }

          .follow-btn {
            padding: 6px 10px;
            font-size: 0.75rem;
            min-width: 70px;
          }
        }
      `}</style>
    </div>
  )
}
