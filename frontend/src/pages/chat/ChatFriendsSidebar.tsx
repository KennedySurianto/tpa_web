import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X, MessageCircle, Users, Clock, Loader2 } from "lucide-react"
import type { User } from "../../api/gen/user"
import { useAuth } from "../../utils/AuthProvider"
import { avatarBytesToUrl } from "../../utils/avatarConverter"
import defaultAvatar from "../../assets/default.jpg"
import debounce from "../../utils/debounce"
import type { GetFriendsRequest, GetFriendsResponse } from "../../api/gen/follow"
import { followClient } from "../../api/grpc/followClient"

export default function ChatFriendsSidebar() {
  const { user, getAuthMetadata } = useAuth()
  const [friends, setFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  // Initial fetch
  useEffect(() => {
    const fetchInitialFriends = async () => {
      if (!user || !user.id) return

      setLoading(true)
      const req: GetFriendsRequest = {
        userId: user.id,
        page: 1, // Always start with page 1
        limit: limit,
      }

      try {
        const res: GetFriendsResponse = await followClient.GetFriends(req, getAuthMetadata())

        if (res) {
          setFriends(res.users)
          setHasMore(res.hasMore)
          setPage(2) // Set to 2 for next fetch
        }
      } catch (err) {
        console.error("Failed to fetch friends:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialFriends()
  }, [user, limit])

  // Fetch more friends function
  const fetchMoreFriends = useCallback(
    async (pageToFetch: number) => {
      if (!user || !user.id) return

      setLoadingMore(true)
      const req: GetFriendsRequest = {
        userId: user.id,
        page: pageToFetch,
        limit: limit,
      }

      try {
        const res: GetFriendsResponse = await followClient.GetFriends(req, getAuthMetadata())

        if (res) {
          setFriends((prev) => [...prev, ...res.users])
          setHasMore(res.hasMore)
        }
      } catch (err) {
        console.error("Failed to fetch more friends:", err)
      } finally {
        setLoadingMore(false)
      }
    },
    [user, limit],
  )

  const handleSearch = useCallback(
    debounce((query: string) => setSearchQuery(query), 300),
    [],
  )

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      const target = e.target as HTMLDivElement
      const bottom = target.scrollHeight <= target.scrollTop + target.clientHeight + 1

      if (bottom && hasMore && !loadingMore && !searchQuery) {
        console.log("Reached the bottom, fetching more...")
        const nextPage = page
        setPage((prev) => prev + 1)
        fetchMoreFriends(nextPage)
      }
    },
    [hasMore, loadingMore, page, fetchMoreFriends, searchQuery],
  )

  const clearSearch = () => {
    setSearchQuery("")
    const searchInput = document.querySelector(".search-input") as HTMLInputElement
    if (searchInput) {
      searchInput.value = ""
    }
  }

  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return "2m"

    const now = Date.now()
    const time = new Date(timestamp).getTime() // Use Date constructor instead of parseInt
    const diff = now - time

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    if (minutes > 0) return `${minutes}m`
    return "now"
  }

  return (
    <div className="sidebar-container">
      {/* Header */}
      <div className="sidebar-header">
        <div className="header-content">
          <div className="title-section">
            <MessageCircle size={24} className="title-icon" />
            <h3 className="sidebar-title">Messages</h3>
          </div>
          <div className="stats-badge">
            <Users size={14} />
            <span>{friends.length}</span>
          </div>
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="search-input"
              autoFocus
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={clearSearch}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Friends List */}
      <div className="friends-list" onScroll={handleScroll}>
        {loading ? (
          <div className="loading-container">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="friend-skeleton">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-content">
                  <div className="skeleton-name"></div>
                  <div className="skeleton-message"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <MessageCircle size={48} />
            </div>
            <h4 className="empty-title">{searchQuery ? "No conversations found" : "No conversations yet"}</h4>
            <p className="empty-description">
              {searchQuery ? "Try searching with a different name" : "Start a conversation with your friends"}
            </p>
          </div>
        ) : (
          <>
            {filteredFriends.map((friend) => (
              <div key={friend.id} className="friend-item" onClick={() => navigate(`/${friend.username}/message`)}>
                <div className="friend-avatar-container">
                  <div className="friend-avatar">
                    <img
                      src={friend.avatar ? avatarBytesToUrl(friend.avatar) || defaultAvatar : defaultAvatar}
                      alt={friend.username}
                      className="avatar-image"
                    />
                  </div>
                  <div className="online-indicator"></div>
                </div>

                <div className="friend-content">
                  <div className="friend-info">
                    <div className="name-section">
                      <span className="friend-name">{friend.displayName || friend.username}</span>
                      {friend.isVerified && <div className="verified-badge">✓</div>}
                    </div>
                    <div className="time-section">
                      <Clock size={12} />
                      <span className="friend-time">{getTimeAgo(friend.lastLoginAt)}</span>
                    </div>
                  </div>

                  <div className="friend-message">
                    <span className="message-preview">Hey, how are you doing? Let's catch up soon!</span>
                    <div className="message-meta">
                      <div className="unread-badge">2</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loadingMore && (
              <div className="loading-more">
                <Loader2 size={16} className="loading-spinner" />
                <span>Loading more conversations...</span>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .sidebar-container {
          width: 380px;
          height: 100vh;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          isolation: isolate;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .title-icon {
          color: #3b82f6;
        }

        .sidebar-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          background: linear-gradient(135deg, #ffffff, #e5e7eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stats-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 1rem;
          color: #3b82f6;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .search-container {
          position: relative;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.875rem;
          color: #ffffff;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #9ca3af;
          pointer-events: none;
          z-index: 1;
        }

        .clear-search {
          position: absolute;
          right: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.375rem;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clear-search:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .friends-list {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0.5rem 0;
          scroll-behavior: smooth;
        }

        .friends-list::-webkit-scrollbar {
          width: 6px;
        }

        .friends-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .friends-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .friends-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .loading-container {
          padding: 0.5rem 0;
        }

        .friend-skeleton {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem 1.5rem;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .skeleton-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .skeleton-content {
          flex: 1;
        }

        .skeleton-name {
          height: 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
          width: 60%;
        }

        .skeleton-message {
          height: 14px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 0.25rem;
          width: 80%;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
          min-height: 300px;
        }

        .empty-icon {
          color: #6b7280;
          margin-bottom: 1.5rem;
          opacity: 0.7;
        }

        .empty-title {
          color: #ffffff;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .empty-description {
          color: #9ca3af;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.4;
        }

        .friend-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 0;
          position: relative;
          border-left: 3px solid transparent;
        }

        .friend-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-left-color: #3b82f6;
          transform: translateX(2px);
        }

        .friend-item:active {
          background: rgba(255, 255, 255, 0.08);
        }

        .friend-avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .friend-avatar {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }

        .friend-item:hover .friend-avatar {
          border-color: rgba(59, 130, 246, 0.5);
          transform: scale(1.05);
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #10b981;
          border: 2px solid #1a1a1a;
          border-radius: 50%;
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
        }

        .friend-content {
          flex: 1;
          min-width: 0;
        }

        .friend-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;
        }

        .name-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }

        .friend-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        .verified-badge {
          background: #3b82f6;
          color: #ffffff;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          line-height: 1;
        }

        .time-section {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #9ca3af;
        }

        .friend-time {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .friend-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }

        .message-preview {
          font-size: 0.85rem;
          color: #d1d5db;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          line-height: 1.3;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .unread-badge {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 0.75rem;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.5rem;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          color: #3b82f6;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .sidebar-container {
            width: 100%;
            max-width: 380px;
          }

          .sidebar-header {
            padding: 1rem;
          }

          .friend-item {
            padding: 0.875rem 1rem;
          }

          .friend-avatar {
            width: 48px;
            height: 48px;
          }

          .friend-name {
            max-width: 120px;
          }
        }
      `}</style>
    </div>
  )
}
