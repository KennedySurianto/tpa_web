import { useEffect, useState } from "react";
import type { FollowRequest } from "../api/gen/follow";
import { followClient } from "../api/grpc/followClient";
import { useNavigate } from "react-router-dom";
import type { User } from "../api/gen/user";
import { useAuth } from "../utils/AuthProvider";
import defaultAvatar from "../assets/default.jpg"
import { avatarBytesToUrl } from "../utils/avatarConverter";

export const UserCard: React.FC<{ user: User; currentUserId: number }> = ({ user }) => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [isFollowed, setIsFollowed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        const checkFollowAndCount = async () => {
            if (currentUser?.id) {
                try {
                    const res = await followClient.GetFollowers({ userId: Number(user.id) });
                    setIsFollowed(res.follows.some((f) => Number(f.followerId) === Number(currentUser.id)));
                    setFollowerCount(res.follows.length);
                } catch (err) {
                    console.error("Error checking follow:", err);
                }
            }
        };
        checkFollowAndCount();
    }, [currentUser?.id, user.id]);

    const handleToggleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;

        setLoading(true);
        const req: FollowRequest = {
            followerId: Number(currentUser.id),
            followedId: Number(user.id),
        };

        try {
            if (isFollowed) {
                await followClient.Unfollow(req);
                setIsFollowed(false);
                setFollowerCount((prevCount) => Math.max(0, prevCount - 1));
            } else {
                await followClient.Follow(req);
                setIsFollowed(true);
                setFollowerCount((prevCount) => prevCount + 1);
            }
        } catch (err) {
            console.error("Follow/unfollow error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-card" onClick={() => navigate(`/${user.username}`)} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '8px', background: '#1f1f1f', color: 'white', cursor: 'pointer' }}>
            <img
            src={avatarBytesToUrl(user.avatar) || defaultAvatar}
            alt={user.username}
            style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', marginRight: '12px' }}
            />

            <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: 'bold' }}>@{user.username} • {user.displayName}</div>
            {user.bio && (
                <div
                    style={{
                    fontSize: '0.9rem',
                    color: '#ccc',
                    marginTop: '4px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    maxWidth: 'clamp(150px, 30vw, 300px)'
                    }}
                >
                    {user.bio}
                </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto', gap: '6px' }}>
                <div style={{ fontSize: '0.85rem', color: '#aaa' }}>{followerCount} followers</div>
                {currentUser?.id !== user.id && (
                <button
                style={{
                    background: isFollowed
                    ? "rgba(255, 255, 255, 0.1)"
                    : "linear-gradient(45deg, #ff0050, #ff6b35)",
                    color: "white",
                    border: isFollowed ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                    padding: "6px 16px",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: loading ? 0.7 : 1,
                    minWidth: "100px"
                }}
                onMouseOver={(e) => {
                    if (!loading) (e.target as HTMLButtonElement).style.transform = "scale(1.05)";
                }}
                onMouseOut={(e) => {
                    (e.target as HTMLButtonElement).style.transform = "scale(1)";
                }}
                onClick={handleToggleFollow}
                disabled={loading}
                >
                {loading ? "Loading..." : isFollowed ? "Unfollow" : "Follow"}
                </button>
                )}
            </div>
        </div>
        );
};
