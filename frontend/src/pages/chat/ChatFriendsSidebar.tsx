import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { User } from "../../api/gen/user"
import { useAuth } from "../../utils/AuthProvider"
import { avatarBytesToUrl } from "../../utils/avatarConverter"
import defaultAvatar from "../../assets/default.jpg"
import debounce from "../../utils/debounce"
import type { GetFriendsRequest, GetFriendsResponse } from "../../api/gen/follow"
import { followClient } from "../../api/grpc/followClient"

export default function ChatFriendsSidebar() {
    const { user } = useAuth()
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
            // Dummy data for initial load
            // const dummyFriends: User[] = [...Array(10)].map((_, i) => ({
            //     id: (i + 1).toString(),
            //     username: `Friend${i + 1}`,
            //     email: `friend${i + 1}@example.com`,
            //     password: "hashedpassword",
            //     displayName: `Friend ${i + 1}`,
            //     bio: `This is the bio for Friend ${i + 1}`,
            //     avatar: new Uint8Array([i, i + 1, i + 2]),
            //     isVerified: true,
            //     isPrivate: false,
            //     isActive: true,
            //     lastLoginAt: `${Date.now() - i * 100000}`,
            //     country: "USA",
            //     allowDuet: true,
            //     allowStitch: true,
            //     allowDownload: true,
            //     allowComments: true,
            //     createdAt: `${Date.now() - i * 1000000}`,
            //     updatedAt: `${Date.now() - i * 1000000}`,
            // }))
            
            const res: GetFriendsResponse = await followClient.GetFriends(req);
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
            // Simulate fetching more data with different IDs
            // const startId = (pageToFetch - 1) * 10 + 1
            // const dummyFriends: User[] = [...Array(10)].map((_, i) => ({
            // id: (startId + i).toString(),
            // username: `Friend${startId + i}`,
            // email: `friend${startId + i}@example.com`,
            // password: "hashedpassword",
            // displayName: `Friend ${startId + i}`,
            // bio: `This is the bio for Friend ${startId + i}`,
            // avatar: new Uint8Array([i, i + 1, i + 2]),
            // isVerified: true,
            // isPrivate: false,
            // isActive: true,
            // lastLoginAt: `${Date.now() - i * 100000}`,
            // country: "USA",
            // allowDuet: true,
            // allowStitch: true,
            // allowDownload: true,
            // allowComments: true,
            // createdAt: `${Date.now() - i * 1000000}`,
            // updatedAt: `${Date.now() - i * 1000000}`,
            // }))

            const res: GetFriendsResponse = await followClient.GetFriends(req);
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

    const filteredFriends = friends.filter((friend) => friend.username.toLowerCase().includes(searchQuery.toLowerCase()))

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const target = e.target as HTMLDivElement
        const bottom = target.scrollHeight <= target.scrollTop + target.clientHeight + 1

        if (bottom && hasMore && !loadingMore) {
            console.log("Reached the bottom, fetching more...")
            const nextPage = page
            setPage((prev) => prev + 1)
            fetchMoreFriends(nextPage)
        }
        },
        [hasMore, loadingMore, page, fetchMoreFriends],
    )

    return (
        <>
        <div className="sidebar-container">
            {/* Header */}
            <div className="sidebar-header">
            <div className="header-content">
                <h3 className="sidebar-title">Messages</h3>
            </div>
            <div className="search-container">
                <div className="search-input-wrapper">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    placeholder="Search conversations..."
                    className="search-input"
                    onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery && (
                    <button className="clear-search" onClick={() => setSearchQuery("")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    </button>
                )}
                </div>
            </div>
            </div>

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
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path
                        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    </svg>
                </div>
                <p className="empty-text">{searchQuery ? "No conversations found" : "No conversations yet"}</p>
                </div>
            ) : (
                <>
                {filteredFriends.map((friend) => (
                    <div key={friend.id} className="friend-item" onClick={() => navigate(`/${friend.username}/message`)}>
                    <div className="friend-avatar">
                        <img
                        src={friend.avatar ? avatarBytesToUrl(friend.avatar) || defaultAvatar : defaultAvatar}
                        alt={friend.username}
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                    </div>
                    <div className="friend-content">
                        <div className="friend-info">
                        <span className="friend-name">{friend.username}</span>
                        <span className="friend-time">2m</span>
                        </div>
                        <div className="friend-message">
                        <span className="message-preview">Hey, how are you doing?</span>
                        <div className="unread-badge">2</div>
                        </div>
                    </div>
                    </div>
                ))}

                {loadingMore && (
                    <div className="loading-more">
                    <span>Loading more...</span>
                    </div>
                )}
                </>
            )}
            </div>
        </div>

        <style>{`
                .sidebar-container {
                    width: 320px;
                    height: 100vh;
                    background: #1a1a1a;
                    border-right: 1px solid #333;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .sidebar-header {
                    padding: 20px 16px 16px 16px;
                    border-bottom: 1px solid #333;
                    background: #1a1a1a;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .sidebar-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #ffffff;
                    margin: 0;
                }

                .search-container {
                    position: relative;
                }

                .search-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-input {
                    width: 100%;
                    padding: 10px 12px 10px 40px;
                    background: #2a2a2a;
                    border: 1px solid #404040;
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s ease;
                }

                .search-input:focus {
                    border-color: #3b82f6;
                    background: #333;
                }

                .search-input::placeholder {
                    color: #888;
                }

                .search-icon {
                    position: absolute;
                    left: 12px;
                    color: #888;
                    pointer-events: none;
                }

                .clear-search {
                    position: absolute;
                    right: 8px;
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .clear-search:hover {
                    background: #404040;
                    color: #ffffff;
                }

                .friends-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 0;
                }

                .friends-list::-webkit-scrollbar {
                    width: 6px;
                }

                .friends-list::-webkit-scrollbar-track {
                    background: #1a1a1a;
                }

                .friends-list::-webkit-scrollbar-thumb {
                    background: #404040;
                    border-radius: 3px;
                }

                .friends-list::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }

                .friend-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-radius: 0;
                    position: relative;
                }

                .friend-item:hover {
                    background: #2a2a2a;
                }

                .friend-item:active {
                    background: #333;
                }

                .friend-avatar {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    font-weight: 600;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .friend-content {
                    flex: 1;
                    min-width: 0;
                }

                .friend-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }

                .friend-name {
                    font-size: 15px;
                    font-weight: 500;
                    color: #ffffff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .friend-time {
                    font-size: 12px;
                    color: #888;
                }

                .friend-message {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .message-preview {
                    font-size: 13px;
                    color: #aaa;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 180px;
                }

                .unread-badge {
                    background: #3b82f6;
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 10px;
                    min-width: 18px;
                    text-align: center;
                }

                .loading-container {
                    padding: 8px 0;
                }

                .friend-skeleton {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                .skeleton-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: #333;
                }

                .skeleton-content {
                    flex: 1;
                }

                .skeleton-name {
                    height: 16px;
                    background: #333;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    width: 60%;
                }

                .skeleton-message {
                    height: 12px;
                    background: #333;
                    border-radius: 4px;
                    width: 80%;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    text-align: center;
                }

                .empty-icon {
                    color: #555;
                    margin-bottom: 16px;
                }

                .empty-text {
                    color: #888;
                    font-size: 14px;
                    margin: 0;
                }

                .loading-more {
                    padding: 16px;
                    text-align: center;
                    color: #888;
                    font-size: 14px;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                @media (max-width: 768px) {
                    .sidebar-container {
                        width: 100%;
                        max-width: 320px;
                    }
                }
            `}</style>
        </>
    )
}
