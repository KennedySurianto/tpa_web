import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationContext";
import type { User } from "../../api/gen/user";
import { useAuth } from "../../utils/AuthProvider";
import type { GetFriendsRequest, GetFriendsResponse } from "../../api/gen/follow";
import { followClient } from "../../api/grpc/followClient";
import { avatarBytesToUrl } from "../../utils/avatarConverter";
import defaultAvatar from "../../assets/default.jpg";

interface ShareVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  downloadUrl: string;
  caption: string;
}

const ShareVideoModal: React.FC<ShareVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  downloadUrl,
  caption,
}) => {
  const { user, getAuthMetadata } = useAuth();
  const { showNotification } = useNotification();

  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFriends([]);
      setSelectedFriends([]);
      setCopied(false);
      setPage(1);
      setHasMore(true);
      fetchInitialFriends();
    }
  }, [isOpen]);

  // Initial fetch
  const fetchInitialFriends = async () => {
    if (!user || !user.id) return;

    setLoading(true);
    const req: GetFriendsRequest = {
      userId: user.id,
      page: 1,
      limit: limit,
    };

    try {
      const res: GetFriendsResponse = await followClient.GetFriends(req, getAuthMetadata());
      if (res) {
        setFriends(res.users);
        setHasMore(res.hasMore);
        setPage(2); // Set to 2 for next fetch
      }
    } catch (err) {
      console.error("Failed to fetch friends:", err);
      showNotification("Failed to load friends", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch more friends function
  const fetchMoreFriends = useCallback(
    async (pageToFetch: number) => {
      if (!user || !user.id) return;

      setLoadingMore(true);
      const req: GetFriendsRequest = {
        userId: user.id,
        page: pageToFetch,
        limit: limit,
      };

      try {
        const res: GetFriendsResponse = await followClient.GetFriends(req, getAuthMetadata());
        if (res) {
          setFriends((prev) => [...prev, ...res.users]);
          setHasMore(res.hasMore);
        }
      } catch (err) {
        console.error("Failed to fetch more friends:", err);
        showNotification("Failed to load more friends", "error");
      } finally {
        setLoadingMore(false);
      }
    },
    [user, limit, getAuthMetadata],
  );

  // Handle scroll for infinite loading
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      const target = e.target as HTMLDivElement;
      const bottom = target.scrollHeight <= target.scrollTop + target.clientHeight + 1;

      if (bottom && hasMore && !loadingMore) {
        console.log("Reached the bottom, fetching more friends...");
        const nextPage = page;
        setPage((prev) => prev + 1);
        fetchMoreFriends(nextPage);
      }
    },
    [hasMore, loadingMore, page, fetchMoreFriends],
  );

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      showNotification("Video URL copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showNotification("Failed to copy URL to clipboard", "error");
    }
  };

  const shareViaMessage = () => {
    if (selectedFriends.length === 0) {
      showNotification("Please select at least one friend to share with", "error");
      return;
    }

    const names = selectedFriends
      .map((id) => friends.find((f) => f.id === id)?.username)
      .filter(Boolean)
      .join(", ");

    showNotification(`Video shared with: ${names}`, "success");
    setTimeout(() => onClose(), 1500);
  };

  const downloadVideo = async () => {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const sanitizedCaption = caption
        .trim()
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const filename = sanitizedCaption ? `${sanitizedCaption}.mp4` : "video.mp4";

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`Video "${filename}" download started`, "success");
    } catch (err) {
      showNotification("Download failed", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Share Video</h2>
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            {/* Left Side - Friends List */}
            <div className="friends-section">
              <div className="section-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="section-icon"
                >
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path
                    d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <label className="section-label">
                  Share with friends ({selectedFriends.length} selected)
                </label>
              </div>

              <div className="friends-list" onScroll={handleScroll}>
                {loading ? (
                  <div className="loading-container">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="friend-skeleton">
                        <div className="skeleton-avatar"></div>
                        <div className="skeleton-content">
                          <div className="skeleton-name"></div>
                          <div className="skeleton-username"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : friends.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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
                    <p className="empty-text">No friends found</p>
                  </div>
                ) : (
                  <>
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className={`friend-item ${selectedFriends.includes(friend.id) ? "selected" : ""}`}
                        onClick={() => toggleFriend(friend.id)}
                      >
                        <div className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={selectedFriends.includes(friend.id)}
                            onChange={() => toggleFriend(friend.id)}
                            className="friend-checkbox"
                          />
                          <div className="checkbox-custom">
                            {selectedFriends.includes(friend.id) && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M20 6L9 17l-5-5"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                        </div>

                        <div className="friend-avatar">
                          <img
                            src={
                              friend.avatar
                                ? avatarBytesToUrl(friend.avatar) || defaultAvatar
                                : defaultAvatar
                            }
                            alt={friend.username}
                            className="avatar-image"
                          />
                        </div>

                        <div className="friend-info">
                          <span className="friend-name">
                            {friend.displayName || friend.username}
                          </span>
                          <span className="friend-username">@{friend.username}</span>
                        </div>
                      </div>
                    ))}

                    {loadingMore && (
                      <div className="loading-more">
                        <div className="loading-spinner"></div>
                        <span>Loading more friends...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                className={`share-button ${selectedFriends.length === 0 ? "disabled" : ""}`}
                onClick={shareViaMessage}
                disabled={selectedFriends.length === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Share via Message
              </button>
            </div>

            {/* Right Side - URL and Actions */}
            <div className="actions-section">
              {/* URL Copy Section */}
              <div className="section">
                <label className="section-label">Video Link</label>
                <div className="url-container">
                  <input className="url-input" value={videoUrl} readOnly />
                  <button className={`copy-button ${copied ? "copied" : ""}`} onClick={copyUrl}>
                    {copied ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path
                          d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="actions">
                <button className="action-button secondary" onClick={downloadVideo}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download Video
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
          background: #1a1a1a;
          border-radius: 16px;
          width: 100%;
          max-width: 700px;
          max-height: 500px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
          animation: slideIn 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid #374151;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #374151;
          color: #ffffff;
        }

        .modal-body {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        .friends-section {
          flex: 1;
          padding: 24px;
          border-right: 1px solid #374151;
          display: flex;
          flex-direction: column;
        }

        .actions-section {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .section-icon {
          color: #9ca3af;
        }

        .section-label {
          font-size: 14px;
          font-weight: 500;
          color: #d1d5db;
        }

        .friends-list {
          flex: 1;
          overflow-y: auto;
          border-radius: 8px;
          border: 1px solid #374151;
          background: #111827;
        }

        .friends-list::-webkit-scrollbar {
          width: 6px;
        }

        .friends-list::-webkit-scrollbar-track {
          background: #1f2937;
        }

        .friends-list::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }

        .friends-list::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
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
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #374151;
        }

        .skeleton-content {
          flex: 1;
        }

        .skeleton-name {
          height: 14px;
          background: #374151;
          border-radius: 4px;
          margin-bottom: 6px;
          width: 60%;
        }

        .skeleton-username {
          height: 12px;
          background: #374151;
          border-radius: 4px;
          width: 40%;
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
          color: #6b7280;
          margin-bottom: 12px;
        }

        .empty-text {
          color: #9ca3af;
          font-size: 14px;
          margin: 0;
        }

        .friend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #374151;
        }

        .friend-item:last-child {
          border-bottom: none;
        }

        .friend-item:hover {
          background: #1f2937;
        }

        .friend-item.selected {
          background: #1e3a8a;
        }

        .friend-item.selected:hover {
          background: #1e40af;
        }

        .checkbox-container {
          position: relative;
        }

        .friend-checkbox {
          opacity: 0;
          position: absolute;
          width: 0;
          height: 0;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border: 2px solid #6b7280;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: transparent;
        }

        .friend-item.selected .checkbox-custom {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #ffffff;
        }

        .friend-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .friend-info {
          flex: 1;
          min-width: 0;
        }

        .friend-name {
          display: block;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .friend-username {
          display: block;
          color: #9ca3af;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          color: #9ca3af;
          font-size: 14px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #374151;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .section {
          margin-bottom: 16px;
        }

        .url-container {
          display: flex;
          gap: 0;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #374151;
          background: #111827;
        }

        .url-input {
          flex: 1;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .url-input::selection {
          background: #3b82f6;
        }

        .copy-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #3b82f6;
          color: #ffffff;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .copy-button:hover {
          background: #2563eb;
        }

        .copy-button.copied {
          background: #10b981;
        }

        .copy-button.copied:hover {
          background: #059669;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .action-button.secondary {
          background: #374151;
          color: #ffffff;
          border: 1px solid #4b5563;
        }

        .action-button.secondary:hover {
          background: #4b5563;
        }

        .share-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          background: #3b82f6;
          color: #ffffff;
          margin-top: 16px;
          width: 100%;
        }

        .share-button:hover:not(.disabled) {
          background: #2563eb;
        }

        .share-button.disabled {
          background: #374151;
          color: #6b7280;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95) translateZ(0);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1) translateZ(0);
          }
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
          .modal-container {
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 32px);
            flex-direction: column;
          }

          .modal-body {
            flex-direction: column;
          }

          .friends-section {
            border-right: none;
            border-bottom: 1px solid #374151;
            flex: 0 0 auto;
            max-height: 200px;
          }

          .actions-section {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </>
  );
};

export default ShareVideoModal;
