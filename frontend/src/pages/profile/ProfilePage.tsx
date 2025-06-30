import React, { useEffect, useState } from 'react';
import type { GetUserByUsernameRequest, User } from '../../api/gen/user';
import { useNavigate, useParams } from 'react-router-dom';
import { userClient } from '../../api/grpc/userClient';
import { useAuth } from '../../utils/AuthProvider';
import type { FollowRequest, UserRequest } from '../../api/gen/follow';
import { followClient } from '../../api/grpc/followClient';
import { avatarBytesToUrl } from '../../utils/avatarConverter';
import type { GetVideosByUserIdRequest, GetVideosResponse, Video } from '../../api/gen/video';
import { videoClient } from '../../api/grpc/videoClient';
import { VideoDetailModal } from '../modals/VideoDetailModal';
import { FollowerListModal } from '../modals/FollowerListModal';
import { FollowingListModal } from '../modals/FollowingListModal';
import VideoTab from '../../components/VideoTab';
import PlaylistTab from '../../components/PlaylistTab';
import { useLikedVideos } from "../../hooks/useLikedVideos";
import defaultAvatar from "../../assets/default.jpg"

const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
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
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isFollowerModalOpen, setFollowerModalOpen] = useState(false);
    const [isFollowingModalOpen, setFollowingModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('videos');
    const [totalLikes, setTotalLikes] = useState<number>(0);

    const { videos: likedVideos } = useLikedVideos(selectedUser?.id ? Number(selectedUser.id) : 0);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    }

    useEffect(() => {
        const fetchUser = async () => {
            if (!username) {
                setError('Username is missing.');
                setLoading(false);
                return;
            }

            try {
                const req: GetUserByUsernameRequest = { username };
                const res: User = await userClient.GetUserByUsername(req);
                setSelectedUser(res);
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Failed to fetch user data.');
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
                    currentUserId: Number(user?.id) || 0
                }
                
                const res: GetVideosResponse= await videoClient.GetVideosByUserId(req);
                if (res && res.videos) {
                    console.log("res.videos: ", res.videos);
                    setVideos(res.videos);
                } 
            } catch (err) {
                console.error(err);
            }
        }

        fetchVideos();
    }, [user, selectedUser]);

    const checkFollowStatus = async (followerId: number, followedId: number) => {
        try {
            const req: UserRequest = { userId: followerId };
            const res = await followClient.GetFollowing(req);
            
            const isUserFollowed = res.follows.some(
                follow => follow.followedId === followedId
            );
            setIsFollowing(isUserFollowed);
        } catch (err) {
            console.error('Error checking follow status:', err);
        }
    };

    const getFollowCounts = async (userId: number) => {
        try {
            const [followersRes, followingRes] = await Promise.all([
                followClient.GetFollowers({ userId }),
                followClient.GetFollowing({ userId })
            ]);
            
            setFollowersCount(followersRes.follows.length);
            setFollowingCount(followingRes.follows.length);
        } catch (err) {
            console.error('Error fetching follow counts:', err);
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

    const getLikeCounts = async(userId: number) => {
        try {
            const req: GetVideosByUserIdRequest = { userId, currentUserId: Number(user?.id) || 0 };
            const res: GetVideosResponse = await videoClient.GetVideosByUserId(req);
            if (res && res.videos) {
                const totalLikes = res.videos.reduce((acc, video) => acc + Number(video.likeCount), 0);
                return totalLikes;
            }
            return 0;
        } catch (err) {
            console.error('Error fetching like counts:', err);
            return 0;
        }
    }

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
                followedId: followedId
            };

            if (isFollowing) {
                // Unfollow
                await followClient.Unfollow(req);
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
                console.log("UNFOLLOWED");
            } else {
                // Follow
                await followClient.Follow(req);
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
                console.log("FOLLOWED");
            }
        } catch (err) {
            console.error('Error following/unfollowing:', err);
            setError('Failed to update follow status.');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleEditProfile = () => {
        navigate("/edit-profile")
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #000 0%, #111 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.2rem'
            }}>
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #000 0%, #111 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff6b35',
                fontSize: '1.2rem'
            }}>
                Error: {error}
            </div>
        );
    }

    if (!selectedUser) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #000 0%, #111 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ccc',
                fontSize: '1.2rem'
            }}>
                User not found.
            </div>
        );
    }

    const getAvatarDisplay = (): string => {
        return selectedUser?.avatar ? avatarBytesToUrl(selectedUser.avatar) || defaultAvatar : defaultAvatar;
    };

    const formatJoinDate = (timestamp: string | undefined) => {
        if (!timestamp) return 'Member since unknown';

        const seconds = parseInt(timestamp, 10);
        if (isNaN(seconds)) return 'Member since unknown';

        const joinDate = new Date(seconds * 1000);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };

        return `Joined ${joinDate.toLocaleDateString('en-US', options)}`;
    };

    const isOwnProfile: boolean = !!(user && selectedUser && user.id === selectedUser.id);

    return (
        <div style={{ 
            height: '100vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, #000 0%, #111 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '20px 10px'
        }}>
            {/* Profile Content */}
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '0 15px'
            }}>
                {/* Avatar and Basic Info */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 'clamp(100px, 20vw, 120px)',
                        height: 'clamp(100px, 20vw, 120px)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        border: '3px solid transparent',
                        backgroundClip: 'padding-box',
                        position: 'relative'
                    }}>
                        <img 
                            src={getAvatarDisplay()} 
                            alt={selectedUser.username}
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                objectFit: "cover"
                            }} 
                        />
                        {!selectedUser.avatar && getAvatarDisplay()}
                        {selectedUser.isVerified && (
                            <div style={{
                                position: 'absolute',
                                bottom: '5px',
                                right: '5px',
                                background: '#20d5ec',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: 'rgba(255, 255, 255, 0.1)'
                            }}>
                                <span style={{ fontSize: '0.8rem', color: '#000' }}>✓</span>
                            </div>
                        )}
                    </div>
                    
                    <h2 style={{ 
                        fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', 
                        fontWeight: 'bold', 
                        color: '#fff',
                        margin: '0 0 0.5rem 0',
                        wordBreak: 'break-word'
                    }}>
                        @{selectedUser.username}
                    </h2>
                    <p style={{ 
                        fontSize: 'clamp(0.9rem, 3vw, 1rem)', 
                        color: '#ccc',
                        margin: '0 0 1rem 0',
                        wordBreak: 'break-word'
                    }}>
                        {selectedUser.displayName}
                    </p>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{ cursor: 'pointer' }} onClick={() => setFollowingModalOpen(true)}>
                        <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 'bold', color: '#fff' }}>
                            {followingCount}
                        </div>
                        <div style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', color: '#ccc' }}>
                            Following
                        </div>
                    </div>
                    <div style={{ cursor: 'pointer' }} onClick={() => setFollowerModalOpen(true)}>
                        <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 'bold', color: '#fff' }}>
                            {followersCount}
                        </div>
                        <div style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', color: '#ccc' }}>
                            Followers
                        </div>
                    </div>
                    <div>
                        <div style={{ 
                            fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', 
                            fontWeight: 'bold', 
                            color: '#fff' 
                        }}>
                            {totalLikes}
                        </div>
                        <div style={{ 
                            fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
                            color: '#ccc' 
                        }}>
                            Likes
                        </div>
                    </div>
                </div>

                {/* Private Account Message */}
                {selectedUser.isPrivate && !isOwnProfile ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            padding: 'clamp(1.5rem, 5vw, 2rem)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '1rem' }}>🔒</div>
                            <h3 style={{ 
                                marginBottom: '0.5rem', 
                                color: '#fff',
                                fontSize: 'clamp(1.1rem, 4vw, 1.3rem)'
                            }}>
                                This account is private
                            </h3>
                            <p style={{ 
                                color: '#ccc', 
                                margin: 0,
                                fontSize: 'clamp(0.9rem, 3vw, 1rem)'
                            }}>
                                Follow this account to see their content
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Bio */}
                        {selectedUser.bio && (
                            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                <p style={{ 
                                    fontSize: 'clamp(0.9rem, 3vw, 1rem)', 
                                    lineHeight: '1.5',
                                    color: '#fff',
                                    maxWidth: '400px',
                                    margin: '0 auto',
                                    wordBreak: 'break-word'
                                }}>
                                    {selectedUser.bio}
                                </p>
                            </div>
                        )}

                        {/* User Details */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: 'clamp(1rem, 4vw, 1.5rem)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                {selectedUser.country && (
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        marginBottom: '1rem',
                                        fontSize: 'clamp(0.9rem, 3vw, 1rem)'
                                    }}>
                                        <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🌍</span>
                                        <span style={{ color: '#ccc', wordBreak: 'break-word' }}>
                                            {selectedUser.country}
                                        </span>
                                    </div>
                                )}
                                
                                {selectedUser.createdAt && (
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        marginBottom: '1rem',
                                        fontSize: 'clamp(0.9rem, 3vw, 1rem)'
                                    }}>
                                        <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📅</span>
                                        <span style={{ color: '#ccc' }}>{formatJoinDate(selectedUser.createdAt)}</span>
                                    </div>
                                )}

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                                }}>
                                    <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📧</span>
                                    <span style={{ 
                                        color: '#ccc', 
                                        wordBreak: 'break-all',
                                        overflow: 'hidden'
                                    }}>
                                        {selectedUser.email}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!isOwnProfile ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 'clamp(0.5rem, 2vw, 1rem)',
                                marginBottom: '2rem',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    style={{
                                        background: isFollowing
                                            ? 'rgba(255, 255, 255, 0.1)'
                                            : 'linear-gradient(45deg, #ff0050, #ff6b35)',
                                        color: 'white',
                                        border: isFollowing ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                                        padding: 'clamp(10px, 3vw, 12px) clamp(20px, 5vw, 24px)',
                                        borderRadius: '8px',
                                        fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                                        fontWeight: 'bold',
                                        cursor: followLoading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        opacity: followLoading ? 0.7 : 1,
                                        minWidth: '100px',
                                        flex: '1',
                                        maxWidth: '150px'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!followLoading) {
                                            (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                                    }}
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                >
                                    {followLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
                                </button>
                                <button
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        padding: 'clamp(10px, 3vw, 12px) clamp(20px, 5vw, 24px)',
                                        borderRadius: '8px',
                                        fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        minWidth: '100px',
                                        flex: '1',
                                        maxWidth: '150px'
                                    }}
                                    onMouseOver={(e) => {
                                        (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
                                    }}
                                    onMouseOut={(e) => {
                                        (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    onClick={() => navigate(`/${username}/message`)}
                                >
                                    Message
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 'clamp(0.5rem, 2vw, 1rem)',
                                marginBottom: '2rem',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        padding: 'clamp(10px, 3vw, 12px) clamp(20px, 5vw, 24px)',
                                        borderRadius: '8px',
                                        fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        minWidth: '100px',
                                        flex: '1',
                                        maxWidth: '150px'
                                    }}
                                    onMouseOver={(e) => {
                                        (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
                                    }}
                                    onMouseOut={(e) => {
                                        (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    onClick={handleEditProfile}
                                >
                                    Edit Profile
                                </button>

                                {/* todo: settings page */}
                            </div>
                        )}

                        <div className="tabs">
                            <button 
                                onClick={() => handleTabChange('videos')} 
                                className={activeTab === 'videos' ? 'active' : ''}
                            >
                                Videos
                            </button>
                            <button 
                                onClick={() => handleTabChange('likedVideos')} 
                                className={activeTab === 'likedVideos' ? 'active' : ''}
                            >
                                Liked Videos
                            </button>
                            <button 
                                onClick={() => handleTabChange('playlists')} 
                                className={activeTab === 'playlists' ? 'active' : ''}
                            >
                                Playlists
                            </button>
                            <button 
                                onClick={() => handleTabChange('favouriteVideos')} 
                                className={activeTab === 'favouriteVideos' ? 'active' : ''}
                            >
                                Favorite Videos
                            </button>
                        </div>

                        <div className="tab-content">
                            {activeTab === 'videos' && 
                                <VideoTab 
                                    videos={videos} 
                                    isOwnProfile={isOwnProfile}
                                    isVideoTab={true}
                                    setSelectedVideo={setSelectedVideo} 
                                    setModalOpen={setModalOpen} 
                                />}
                            {activeTab === 'likedVideos' && 
                                <VideoTab 
                                    videos={likedVideos} 
                                    isOwnProfile={isOwnProfile}
                                    isVideoTab={false}
                                    setSelectedVideo={setSelectedVideo} 
                                    setModalOpen={setModalOpen} 
                                />}
                            {activeTab === 'playlists' && 
                                <PlaylistTab 
                                    userId={selectedUser.id}
                                    isOwnProfile={isOwnProfile}
                                />}
                            {activeTab === 'favouriteVideos' && 
                                <VideoTab 
                                    videos={videos} 
                                    isOwnProfile={isOwnProfile} 
                                    isVideoTab={false}
                                    setSelectedVideo={setSelectedVideo} 
                                    setModalOpen={setModalOpen} 
                                />}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <VideoDetailModal
                video={selectedVideo}
                isOpen={modalOpen}
                onClose={() => {
                    setSelectedVideo(null);
                    setModalOpen(false);
                }}
            />
            <FollowerListModal
                userId={Number(selectedUser.id)}
                isOpen={isFollowerModalOpen}
                onClose={() => setFollowerModalOpen(false)}
            />
            <FollowingListModal
                userId={Number(selectedUser.id)}
                isOpen={isFollowingModalOpen}
                onClose={() => setFollowingModalOpen(false)}
            />

            <style>
            {`
                .tabs {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-bottom: 1rem;
                }

                .tabs button {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 12px 24px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.2s ease, transform 0.2s ease;
                    min-width: 100px;
                    text-align: center;
                }

                .tabs button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }

                .tabs button.active {
                    background: linear-gradient(45deg, #ff0050, #ff6b35);
                    color: white;
                    border: none;
                }

                .tabs button:focus {
                    outline: none;
                }
            `}
            </style>
        </div>
    );
};

export default ProfilePage;