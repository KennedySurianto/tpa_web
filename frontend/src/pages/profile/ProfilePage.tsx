import type React from "react";
import { useEffect, useState } from "react";
import type { GetUserByUsernameRequest, User } from "../../api/gen/user";
import { useNavigate, useParams } from "react-router-dom";
import { userClient } from "../../api/grpc/userClient";
import { useAuth } from "../../utils/AuthProvider";
import type { FollowRequest, UserRequest } from "../../api/gen/follow";
import { followClient } from "../../api/grpc/followClient";
import { avatarBytesToUrl } from "../../utils/avatarConverter";
import type { GetVideosByUserIdRequest, GetVideosResponse, Video } from "../../api/gen/video";
import { videoClient } from "../../api/grpc/videoClient";
import { UserListModal } from "../modals/UserListModal";
import VideoTab from "../../components/VideoTab";
import PlaylistTab from "../../components/PlaylistTab";
import { useLikedVideos } from "../../hooks/useLikedVideos";
import defaultAvatar from "../../assets/default.jpg";
import {
  CheckCircle,
  Globe,
  Calendar,
  Mail,
  Lock,
  UserPlus,
  UserMinus,
  MessageCircle,
  Settings,
  Play,
  Heart,
  List,
  Star,
  Users,
  UserCheck,
} from "lucide-react";
import { useFollowings } from "../../hooks/useFollowings";
import { useFollowers } from "../../hooks/useFollowers";

const ProfilePage: React.FC = () => {
  const { user, getAuthMetadata, logout } = useAuth();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isFollowerModalOpen, setFollowerModalOpen] = useState(false);
  const [isFollowingModalOpen, setFollowingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");
  const [totalLikes, setTotalLikes] = useState<number>(0);

  const {
    followings,
    error: followingsError,
    loading: followingsLoading,
  } = useFollowings(selectedUser?.id ? Number(selectedUser.id) : 0);
  const {
    followers,
    error: followersError,
    loading: followersLoading,
  } = useFollowers(selectedUser?.id ? Number(selectedUser.id) : 0);

  const { videos: likedVideos } = useLikedVideos(selectedUser?.id ? Number(selectedUser.id) : 0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!username) {
        setError("Username is missing.");
        setLoading(false);
        return;
      }

      try {
        const req: GetUserByUsernameRequest = { username };
        const res: User = await userClient.GetUserByUsername(req);
        setSelectedUser(res);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to fetch user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  useEffect(() => {
    if (!selectedUser?.id) return;

    const runFollowChecks = async () => {
      if (user?.id) {
        await checkFollowStatus(Number(user.id), Number(selectedUser.id));
      }
      await getFollowCounts(Number(selectedUser.id));
    };

    runFollowChecks();
  }, [selectedUser, user]);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!selectedUser || !selectedUser.id || !user || !user.id) return;

      try {
        const req: GetVideosByUserIdRequest = {
          userId: Number(selectedUser?.id) || 0,
          currentUserId: Number(user?.id) || 0,
        };

        const res: GetVideosResponse = await videoClient.GetVideosByUserId(req);
        if (res && res.videos) {
          console.log("res.videos: ", res.videos);
          setVideos(res.videos.filter((video) => video.isPublished));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchVideos();
  }, [user, selectedUser]);

  const checkFollowStatus = async (followerId: number, followedId: number) => {
    try {
      const req: UserRequest = { userId: followerId };
      const res = await followClient.GetFollowing(req);

      const isUserFollowed = res.follows.some((follow) => follow.followedId === followedId);
      setIsFollowing(isUserFollowed);
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  };

  const getFollowCounts = async (userId: number) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        followClient.GetFollowers({ userId }),
        followClient.GetFollowing({ userId }),
      ]);

      setFollowersCount(followersRes.follows.length);
      setFollowingCount(followingRes.follows.length);
    } catch (err) {
      console.error("Error fetching follow counts:", err);
    }
  };

  useEffect(() => {
    if (!selectedUser) return;

    const fetchLikeCounts = async () => {
      const totalLikes = await getLikeCounts(Number(selectedUser.id));
      console.log("Total likes for user: ", totalLikes);
      setTotalLikes(totalLikes);
    };

    fetchLikeCounts();
  }, [selectedUser]);

  const getLikeCounts = async (userId: number) => {
    try {
      const req: GetVideosByUserIdRequest = { userId, currentUserId: Number(user?.id) || 0 };
      const res: GetVideosResponse = await videoClient.GetVideosByUserId(req);
      if (res && res.videos) {
        const totalLikes = res.videos.reduce((acc, video) => acc + Number(video.likeCount), 0);
        return totalLikes;
      }
      return 0;
    } catch (err) {
      console.error("Error fetching like counts:", err);
      return 0;
    }
  };

  const handleFollow = async () => {
    if (!user) {
      console.log("User not authenticated!");
      logout();
      return;
    }

    if (!selectedUser || followLoading) {
      console.log("Please try again later.");
      setError("Please try again later.");
      return;
    }

    const followerId = Number(user.id);
    const followedId = Number(selectedUser.id);

    if (!(followedId && followerId)) {
      return;
    }

    setFollowLoading(true);

    try {
      const req: FollowRequest = {
        followerId: followerId,
        followedId: followedId,
      };

      if (isFollowing) {
        // Unfollow
        await followClient.Unfollow(req, getAuthMetadata());
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        console.log("UNFOLLOWED");
      } else {
        // Follow
        await followClient.Follow(req, getAuthMetadata());
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        console.log("FOLLOWED");
      }
    } catch (err) {
      console.error("Error following/unfollowing:", err);
      setError("Failed to update follow status.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || followingsError || followersError) {
    return (
      <div className="error-container">
        <p>Error: {error || followingsError}</p>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="error-container">
        <p>User not found.</p>
      </div>
    );
  }

  const getAvatarDisplay = (): string => {
    return selectedUser?.avatar
      ? avatarBytesToUrl(selectedUser.avatar) || defaultAvatar
      : defaultAvatar;
  };

  const formatJoinDate = (timestamp: string | undefined) => {
    if (!timestamp) return "Member since unknown";
    const seconds = Number.parseInt(timestamp, 10);
    if (isNaN(seconds)) return "Member since unknown";
    const joinDate = new Date(seconds * 1000);
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long" };
    return `Joined ${joinDate.toLocaleDateString("en-US", options)}`;
  };

  const isOwnProfile: boolean = !!(user && selectedUser && user.id === selectedUser.id);

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="avatar-wrapper">
            <img
              src={getAvatarDisplay() || "/placeholder.svg"}
              alt={selectedUser.username}
              className="avatar"
            />
            {selectedUser.isVerified && (
              <div className="verification-badge">
                <CheckCircle size={16} />
              </div>
            )}
          </div>

          <div className="user-info">
            <h2 className="username">@{selectedUser.username}</h2>
            <p className="display-name">{selectedUser.displayName}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            padding: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease, background 0.2s ease",
              padding: "0.5rem",
              borderRadius: "12px",
            }}
            onClick={() => setFollowingModalOpen(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <UserCheck
              style={{
                color: "#8b949e",
                marginBottom: "0.5rem",
              }}
              size={20}
            />
            <div
              style={{
                fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
                fontWeight: "700",
                color: "#ffffff",
                marginBottom: "0.25rem",
              }}
            >
              {followingCount}
            </div>
            <div
              style={{
                fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)",
                color: "#8b949e",
              }}
            >
              Following
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease, background 0.2s ease",
              padding: "0.5rem",
              borderRadius: "12px",
            }}
            onClick={() => setFollowerModalOpen(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Users
              style={{
                color: "#8b949e",
                marginBottom: "0.5rem",
              }}
              size={20}
            />
            <div
              style={{
                fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
                fontWeight: "700",
                color: "#ffffff",
                marginBottom: "0.25rem",
              }}
            >
              {followersCount}
            </div>
            <div
              style={{
                fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)",
                color: "#8b949e",
              }}
            >
              Followers
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease, background 0.2s ease",
              padding: "0.5rem",
              borderRadius: "12px",
            }}
          >
            <Heart
              style={{
                color: "#8b949e",
                marginBottom: "0.5rem",
              }}
              size={20}
            />
            <div
              style={{
                fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
                fontWeight: "700",
                color: "#ffffff",
                marginBottom: "0.25rem",
              }}
            >
              {totalLikes}
            </div>
            <div
              style={{
                fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)",
                color: "#8b949e",
              }}
            >
              Likes
            </div>
          </div>
        </div>

        {/* Private Account Message */}
        {selectedUser.isPrivate && !isOwnProfile ? (
          <div className="private-account">
            <Lock size={48} className="private-icon" />
            <h3 className="private-title">This account is private</h3>
            <p className="private-text">Follow this account to see their content</p>
          </div>
        ) : (
          <>
            {/* Bio Section */}
            {selectedUser.bio && (
              <div className="bio-section">
                <p className="bio-text">{selectedUser.bio}</p>
              </div>
            )}

            {/* User Details */}
            <div className="details-section">
              <div className="details-card">
                {selectedUser.country && (
                  <div className="detail-item">
                    <Globe size={18} />
                    <span>{selectedUser.country}</span>
                  </div>
                )}

                {selectedUser.createdAt && (
                  <div className="detail-item">
                    <Calendar size={18} />
                    <span>{formatJoinDate(selectedUser.createdAt)}</span>
                  </div>
                )}

                <div className="detail-item">
                  <Mail size={18} />
                  <span className="email-text">{selectedUser.email}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile ? (
              <div className="action-buttons">
                <button
                  className={`btn ${isFollowing ? "btn-secondary" : "btn-primary"}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading || followingsLoading || followersLoading ? (
                    <div className="btn-spinner"></div>
                  ) : isFollowing ? (
                    <>
                      <UserMinus size={18} />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Follow
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/${username}/message`)}
                >
                  <MessageCircle size={18} />
                  Message
                </button>
              </div>
            ) : (
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={handleEditProfile}>
                  <Settings size={18} />
                  Edit Profile
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="tabs">
              <button
                onClick={() => handleTabChange("videos")}
                className={`tab ${activeTab === "videos" ? "active" : ""}`}
              >
                <Play size={18} />
                Videos
              </button>
              <button
                onClick={() => handleTabChange("likedVideos")}
                className={`tab ${activeTab === "likedVideos" ? "active" : ""}`}
              >
                <Heart size={18} />
                Liked Videos
              </button>
              <button
                onClick={() => handleTabChange("playlists")}
                className={`tab ${activeTab === "playlists" ? "active" : ""}`}
              >
                <List size={18} />
                Playlists
              </button>
              <button
                onClick={() => handleTabChange("favouriteVideos")}
                className={`tab ${activeTab === "favouriteVideos" ? "active" : ""}`}
              >
                <Star size={18} />
                Favorite Videos
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === "videos" && (
                <VideoTab videos={videos} isOwnProfile={isOwnProfile} isVideoTab={true} />
              )}
              {activeTab === "likedVideos" && (
                <VideoTab videos={likedVideos} isOwnProfile={isOwnProfile} isVideoTab={false} />
              )}
              {activeTab === "playlists" && (
                <PlaylistTab userId={selectedUser.id} isOwnProfile={isOwnProfile} />
              )}
              {activeTab === "favouriteVideos" && (
                <VideoTab videos={videos} isOwnProfile={isOwnProfile} isVideoTab={false} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <UserListModal
        users={followers}
        label="Followers"
        verb="being followed by"
        isOpen={isFollowerModalOpen}
        onClose={() => setFollowerModalOpen(false)}
      />
      <UserListModal
        users={followings}
        label="Following"
        verb="following"
        isOpen={isFollowingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
      />

      <style>{`
                .profile-container {
                    height: 100vh;
                    overflow-y: auto;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    padding: 20px 10px;
                    color: #ffffff;
                }

                .profile-content {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 0 15px;
                }

                .loading-container,
                .error-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    font-size: 1.2rem;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-top: 3px solid #8b5cf6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .profile-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .avatar-wrapper {
                    position: relative;
                    display: inline-block;
                    margin-bottom: 1rem;
                }

                .avatar {
                    width: clamp(100px, 20vw, 120px);
                    height: clamp(100px, 20vw, 120px);
                    border-radius: 50%;
                    object-fit: cover;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }

                .avatar:hover {
                    transform: scale(1.05);
                    box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
                    border: 3px solid transparent;
                    background: linear-gradient(45deg, #8b5cf6, #3b82f6) border-box;
                    background-clip: padding-box;
                }

                .verification-badge {
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    background: #8b5cf6;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid #0a0a0a;
                    color: white;
                }

                .user-info {
                    margin-bottom: 1rem;
                }

                .username {
                    font-size: clamp(1.2rem, 4vw, 1.5rem);
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 0.5rem 0;
                    word-break: break-word;
                }

                .display-name {
                    font-size: clamp(0.9rem, 3vw, 1rem);
                    color: #8b949e;
                    margin: 0 0 1rem 0;
                    word-break: break-word;
                }

                .private-account {
                    text-align: center;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 2rem;
                    backdrop-filter: blur(10px);
                }

                .private-icon {
                    color: #8b949e;
                    margin-bottom: 1rem;
                }

                .private-title {
                    margin-bottom: 0.5rem;
                    color: #ffffff;
                    font-size: clamp(1.1rem, 4vw, 1.3rem);
                    font-weight: 600;
                }

                .private-text {
                    color: #8b949e;
                    margin: 0;
                    font-size: clamp(0.9rem, 3vw, 1rem);
                }

                .bio-section {
                    margin-bottom: 2rem;
                    text-align: center;
                }

                .bio-text {
                    font-size: clamp(0.9rem, 3vw, 1rem);
                    line-height: 1.6;
                    color: #ffffff;
                    max-width: 400px;
                    margin: 0 auto;
                    word-break: break-word;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .details-section {
                    margin-bottom: 2rem;
                }

                .details-card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: clamp(1rem, 4vw, 1.5rem);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 1rem;
                    font-size: clamp(0.9rem, 3vw, 1rem);
                    color: #8b949e;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: background 0.2s ease;
                }

                .detail-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .detail-item:last-child {
                    margin-bottom: 0;
                }

                .email-text {
                    word-break: break-all;
                    overflow: hidden;
                }

                .action-buttons {
                    display: flex;
                    justify-content: center;
                    gap: clamp(0.5rem, 2vw, 1rem);
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: clamp(10px, 3vw, 12px) clamp(20px, 5vw, 24px);
                    border-radius: 12px;
                    font-size: clamp(0.9rem, 3vw, 1rem);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    min-width: 120px;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-primary {
                    background: linear-gradient(45deg, #8b5cf6, #3b82f6);
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .btn-secondary:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
                }

                .btn-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .tabs {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    margin-bottom: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 8px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    flex-wrap: wrap;
                }

                .tab {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: transparent;
                    color: #8b949e;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 100px;
                    justify-content: center;
                    position: relative;
                }

                .tab:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    transform: translateY(-1px);
                }

                .tab.active {
                    background: linear-gradient(45deg, #8b5cf6, #3b82f6);
                    color: white;
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
                }

                .tab:focus {
                    outline: none;
                }

                .tab-content {
                    min-height: 200px;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .profile-container {
                        padding: 16px;
                    }

                    .profile-content {
                        padding: 0 8px;
                    }

                    .action-buttons {
                        flex-direction: column;
                        align-items: center;
                    }

                    .btn {
                        width: 100%;
                        max-width: 200px;
                    }

                    .tabs {
                        flex-direction: column;
                        gap: 4px;
                    }

                    .tab {
                        width: 100%;
                    }
                }

                @media (max-width: 480px) {
                    .details-card {
                        padding: 1rem;
                    }

                    .detail-item {
                        font-size: 0.85rem;
                    }
                }
            `}</style>
    </div>
  );
};

export default ProfilePage;
