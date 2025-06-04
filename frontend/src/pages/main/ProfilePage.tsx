import React, { useEffect, useState } from 'react';
import type { GetUserByUsernameRequest, User } from '../../api/gen/user';
import { useParams } from 'react-router-dom';
import { userClient } from '../../api/grpc/userClient';

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
                console.log(res);
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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!selectedUser) {
        return <div>User not found.</div>;
    }

    const getAvatarDisplay = () => {
        return selectedUser?.avatarUrl || '👤';
    };

    const formatJoinDate = (timestamp: string | undefined) => {
        if (!timestamp) return 'Member since unknown';

        const seconds = parseInt(timestamp, 10);
        if (isNaN(seconds)) return 'Member since unknown';

        const joinDate = new Date(seconds * 1000); // Convert to milliseconds
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };

        return `Joined ${joinDate.toLocaleDateString('en-US', options)}`;
    };

    return (
        <div 
        className='pt-5'
        style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #000 0%, #111 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>

            {/* Profile Content */}
            <div className="container py-4">
                <div className="row justify-center">
                <div className="col-12 col-md-8 col-lg-6">
                    
                    {/* Avatar and Basic Info */}
                    <div className="text-center mb-4">
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: selectedUser.avatarUrl 
                            ? `url(${selectedUser.avatarUrl}) center/cover` 
                            : 'linear-gradient(135deg, #ff0050, #ff6b35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: selectedUser.avatarUrl ? '0' : '3rem',
                        margin: '0 auto 1rem',
                        border: '3px solid transparent',
                        backgroundClip: 'padding-box',
                        position: 'relative'
                    }}>
                        {!selectedUser.avatarUrl && getAvatarDisplay()}
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
                            border: '2px solid #000'
                        }}>
                            <span style={{ fontSize: '0.8rem', color: '#000' }}>✓</span>
                        </div>
                        )}
                    </div>
                    
                    <h2 className="mb-1" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                        @{selectedUser.username}
                    </h2>
                    <p className="mb-2" style={{ fontSize: '1rem', color: '#ccc' }}>
                        {selectedUser.displayName}
                    </p>
                    </div>

                    {/* Stats Placeholder */}
                        <div className="row mb-4">
                        <div className="col-4 text-center">
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>0</div>
                            <div style={{ fontSize: '0.9rem', color: '#ccc' }}>Following</div>
                        </div>
                        <div className="col-4 text-center">
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>0</div>
                            <div style={{ fontSize: '0.9rem', color: '#ccc' }}>Followers</div>
                        </div>
                        <div className="col-4 text-center">
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>0</div>
                            <div style={{ fontSize: '0.9rem', color: '#ccc' }}>Likes</div>
                        </div>
                    </div>

                    {/* Private Account Message */}
                    {selectedUser.isPrivate ? (
                    <div className="text-center py-5">
                        <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '2rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>This account is private</h3>
                        <p style={{ color: '#ccc', margin: 0 }}>
                            Follow this account to see their content
                        </p>
                        </div>
                    </div>
                    ) : (
                    <>
                        {/* Bio */}
                        {selectedUser.bio && (
                        <div className="mb-4 text-center">
                            <p style={{ 
                            fontSize: '1rem', 
                            lineHeight: '1.5',
                            color: '#fff',
                            maxWidth: '400px',
                            margin: '0 auto'
                            }}>
                            {selectedUser.bio}
                            </p>
                        </div>
                        )}

                        {/* User Details */}
                        <div className="mb-4">
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                {selectedUser.country && (
                                <div className="d-flex align-center mb-3">
                                    <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🌍</span>
                                    <span style={{ color: '#ccc' }}>{selectedUser.country}</span>
                                </div>
                                )}
                                
                                {selectedUser.createdAt && (
                                <div className="d-flex align-center mb-3">
                                    <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📅</span>
                                    <span style={{ color: '#ccc' }}>{formatJoinDate(selectedUser.createdAt)}</span>
                                </div>
                                )}

                                <div className="d-flex align-center">
                                    <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📧</span>
                                    <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{selectedUser.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex justify-center gap-2 mb-4">
                            <button style={{
                                background: 'linear-gradient(45deg, #ff0050, #ff6b35)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseOver={(e) => (e.target as HTMLButtonElement).style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => (e.target as HTMLButtonElement).style.transform = 'scale(1)'}
                            >
                                Follow
                            </button>
                            <button style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
                            }}
                            onMouseOut={(e) => {
                                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            >
                                Message
                            </button>
                        </div>

                        {/* Content Tabs */}
                        <div className="text-center">
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '2rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📹</div>
                                <p style={{ color: '#ccc', margin: 0 }}>
                                    No videos yet
                                </p>
                            </div>
                        </div>
                    </>
                    )}
                </div>
            </div>
        </div>
    </div>
    );
};

export default ProfilePage;