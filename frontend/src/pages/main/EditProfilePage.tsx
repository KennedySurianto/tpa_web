import React, { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type { GetUserByIdRequest, UpdateUserRequest, User } from '../../api/gen/user';
import { useAuth } from '../../utils/AuthProvider';
import { userClient } from '../../api/grpc/userClient';
import { useNavigate } from 'react-router-dom';
import { avatarBytesToUrl } from '../../utils/avatarConverter';

// Helper function to format Unix timestamps
const formatTimestamp = (timestampStr: string | undefined): string => {
    if (!timestampStr) return 'N/A';
    const timestampNum = parseInt(timestampStr, 10);
    if (isNaN(timestampNum)) {
        return 'Invalid date';
    }
    return new Date(timestampNum * 1000).toLocaleString();
};

// Enhanced styles with modern design
const containerStyle: React.CSSProperties = {
    height: '100vh',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
    padding: '1rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    padding: '2rem',
    margin: '0 auto',
    maxWidth: '1200px',
    width: '100%',
};

const pageTitleStyle: React.CSSProperties = {
    fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '0.5rem',
    letterSpacing: '-0.025em',
};

const subtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '2rem',
    fontWeight: '400',
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1.5rem',
    marginTop: '2.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #e2e8f0',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
    display: 'block',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#1f2937',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box',
};

const focusInputStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgb(59 130 246 / 0.1)',
    outline: 'none',
};

const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit',
};

const checkboxStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    marginRight: '0.75rem',
    accentColor: '#3b82f6',
    cursor: 'pointer',
};

const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0',
    fontWeight: '400',
};

const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
};

const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
};

const primaryButtonHoverStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: '#2563eb',
};

const disabledButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    opacity: 0.6,
};

const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f8fafc',
    color: '#374151',
    border: '1px solid #d1d5db',
};

const loadingStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
    color: '#64748b',
};

const avatarContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem',
};

const avatarStyle: React.CSSProperties = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #e2e8f0',
    marginBottom: '1rem',
    transition: 'all 0.2s ease-in-out',
};

const avatarPlaceholderStyle: React.CSSProperties = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '4px solid #e2e8f0',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
};

const messageStyle: React.CSSProperties = {
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
};

const successStyle: React.CSSProperties = {
    ...messageStyle,
    backgroundColor: '#d1fae5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
};

const errorStyle: React.CSSProperties = {
    ...messageStyle,
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
};

const infoRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 200px) 1fr',
    gap: '1rem',
    marginBottom: '1rem',
    alignItems: 'center',
};

const infoLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
};

const infoValueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0',
};

const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: '1.5rem',
    marginBottom: '1.5rem',
};

const EditProfilePage: React.FC = () => {
    const authUser = useAuth().user;
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [formData, setFormData] = useState<User | null>(null);
    const [originalData, setOriginalData] = useState<User | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('👤');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [focusedInput, setFocusedInput] = useState<string>('');
    const navigate = useNavigate();

    // Check if form has changes
    const hasChanges = React.useMemo(() => {
        if (!formData || !originalData) return false;
        
        const compareFields = [
            'username', 'displayName', 'bio', 'avatar', 'country',
            'isPrivate', 'isActive', 'isVerified', 
            'allowComments', 'allowDuet', 'allowStitch', 'allowDownload'
        ];
        
        return compareFields.some(field => 
            formData[field as keyof User] !== originalData[field as keyof User]
        );
    }, [formData, originalData]);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
                setErrorMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    // Effect to fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            setErrorMessage('');
            
            if (!(authUser && authUser.id)) {
                console.warn('No authenticated user ID found.');
                setUserProfile(null);
                setErrorMessage('No authenticated user found. Please log in.');
                setIsLoading(false);
                return;
            }

            try {
                const req: GetUserByIdRequest = { id: authUser.id };
                const res: User = await userClient.GetUserById(req);
                console.log('Fetched user data:', res);
                setUserProfile(res);
            } catch (err) {
                console.error('Error fetching user:', err);
                setUserProfile(null);
                setErrorMessage('Failed to load profile data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [authUser]);

    // Effect to update formData and avatarPreview when userProfile changes
    useEffect(() => {
        if (userProfile) {
            setFormData(userProfile);
            setOriginalData(userProfile);
            setAvatarPreview(avatarBytesToUrl(userProfile.avatar) || '👤');
        } else {
            setFormData(null);
            setOriginalData(null);
            setAvatarPreview('👤');
        }
    }, [userProfile]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => (prev ? { ...prev, [name]: value } : null));
        if (name === 'avatar') {
            setAvatarPreview(value || '👤');
        }
        // Clear messages when user starts editing
        if (successMessage || errorMessage) {
            setSuccessMessage('');
            setErrorMessage('');
        }
    };

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => (prev ? { ...prev, [name]: checked } : null));
        // Clear messages when user starts editing
        if (successMessage || errorMessage) {
            setSuccessMessage('');
            setErrorMessage('');
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData) {
            setErrorMessage('Profile data is not available.');
            return;
        }

        if (!hasChanges) {
            setErrorMessage('No changes to save.');
            return;
        }

        setIsSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            console.log('Form submitted:', formData);
            
            const req: UpdateUserRequest = {
                id: Number(userProfile?.id) || 0,
                username: formData.username,
                displayName: formData.displayName,
                bio: formData.bio,
                avatar: formData.avatar,
                isVerified: formData.isVerified,
                isPrivate: formData.isPrivate,
                isActive: formData.isActive,
                country: formData.country,
                allowDuet: formData.allowDuet,
                allowStitch: formData.allowStitch,
                allowDownload: formData.allowDownload,
                allowComments: formData.allowComments,
            };

            const res = await userClient.UpdateUser(req);
            if (res) {
                setSuccessMessage('Profile updated successfully!');
                setOriginalData(formData);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setErrorMessage('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarError = () => {
        setAvatarPreview('👤');
    };

    const handleFocus = (inputName: string) => {
        setFocusedInput(inputName);
    };

    const handleBlur = () => {
        setFocusedInput('');
    };

    const getInputStyle = (inputName: string) => {
        return focusedInput === inputName ? focusInputStyle : inputStyle;
    };

    const renderAvatar = () => {
        if (avatarPreview === '👤') {
            return (
                <div style={avatarPlaceholderStyle}>
                    👤
                </div>
            );
        }
        
        return (
            <img
                src={avatarPreview}
                alt="Profile Picture"
                onError={handleAvatarError}
                style={avatarStyle}
            />
        );
    };

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <h1 style={pageTitleStyle}>Edit Profile</h1>
                    <div style={loadingStyle}>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            border: '3px solid #e2e8f0', 
                            borderTop: '3px solid #3b82f6', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite',
                            marginBottom: '1rem'
                        }}></div>
                        <p>Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <h1 style={pageTitleStyle}>Edit Profile</h1>
                    <div style={loadingStyle}>
                        <p>Could not load profile data. Please try again later.</p>
                        <button 
                            style={secondaryButtonStyle}
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={pageTitleStyle}>Edit Profile</h1>
                <p style={subtitleStyle}>Update your personal information and account settings</p>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div style={successStyle}>
                        ✓ {successMessage}
                    </div>
                )}
                {errorMessage && (
                    <div style={errorStyle}>
                        ⚠ {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Avatar Section */}
                    <div style={avatarContainerStyle}>
                        {renderAvatar()}
                        <div style={{ width: '100%', maxWidth: '400px' }}>
                            <label htmlFor="avatar" style={labelStyle}>Upload Profile Picture</label>
                            <input
                                type="file"
                                id="avatar"
                                name="avatar"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const buffer = await file.arrayBuffer();
                                    const bytes = new Uint8Array(buffer);

                                    setFormData(prev =>
                                        prev ? { ...prev, avatar: bytes } : null
                                    );

                                    // Update preview
                                    const base64 = btoa(String.fromCharCode(...bytes));
                                    setAvatarPreview(`data:${file.type};base64,${base64}`);
                                }}
                                onFocus={() => handleFocus('avatar')}
                                onBlur={handleBlur}
                                style={getInputStyle('avatar')}
                            />
                        </div>
                    </div>
                    {/* Personal Information Section */}
                    <h2 style={sectionTitleStyle}>Personal Information</h2>
                    <div style={{ 
                        ...gridStyle, 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' 
                    }}>
                        <div>
                            <label htmlFor="username" style={labelStyle}>Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username || ''}
                                onChange={handleChange}
                                onFocus={() => handleFocus('username')}
                                onBlur={handleBlur}
                                style={getInputStyle('username')}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="displayName" style={labelStyle}>Display Name</label>
                            <input
                                type="text"
                                id="displayName"
                                name="displayName"
                                value={formData.displayName || ''}
                                onChange={handleChange}
                                onFocus={() => handleFocus('displayName')}
                                onBlur={handleBlur}
                                style={getInputStyle('displayName')}
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="country" style={labelStyle}>Country</label>
                            <input
                                type="text"
                                id="country"
                                name="country"
                                value={formData.country || ''}
                                onChange={handleChange}
                                onFocus={() => handleFocus('country')}
                                onBlur={handleBlur}
                                style={getInputStyle('country')}
                            />
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="bio" style={labelStyle}>Bio</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleChange}
                            onFocus={() => handleFocus('bio')}
                            onBlur={handleBlur}
                            style={focusedInput === 'bio' ? { ...textareaStyle, borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgb(59 130 246 / 0.1)' } : textareaStyle}
                            rows={4}
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    {/* Account Settings Section */}
                    <h2 style={sectionTitleStyle}>Account Settings</h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '1.5rem',
                        alignItems: 'start',
                        marginBottom: '1.5rem'
                    }}>
                        <div>
                            <label style={labelStyle}>Password</label>
                            <button 
                                type="button" 
                                style={secondaryButtonStyle}
                                onClick={() => navigate('/forgot-password')}
                            >
                                Change Password
                            </button>
                        </div>
                    </div>

                    {/* Account Status Section */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <label htmlFor="isPrivate" style={checkboxLabelStyle}>
                            <input
                                type="checkbox"
                                id="isPrivate"
                                name="isPrivate"
                                checked={formData.isPrivate || false}
                                onChange={handleCheckboxChange}
                                style={checkboxStyle}
                            />
                            Private Account
                        </label>
                        <label htmlFor="isActive" style={checkboxLabelStyle}>
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive || false}
                                onChange={handleCheckboxChange}
                                style={checkboxStyle}
                            />
                            Account Active
                        </label>
                        <label htmlFor="isVerified" style={checkboxLabelStyle}>
                            <input
                                type="checkbox"
                                id="isVerified"
                                name="isVerified"
                                checked={formData.isVerified || false}
                                onChange={handleCheckboxChange}
                                style={checkboxStyle}
                            />
                            Verified Account
                        </label>
                    </div>

                    {/* Content Settings Section */}
                    <h2 style={sectionTitleStyle}>Content Settings</h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        {[
                            { id: 'allowComments', label: 'Allow Comments' },
                            { id: 'allowDuet', label: 'Allow Duet' },
                            { id: 'allowStitch', label: 'Allow Stitch' },
                            { id: 'allowDownload', label: 'Allow Downloads' },
                        ].map(setting => (
                            <label key={setting.id} htmlFor={setting.id} style={checkboxLabelStyle}>
                                <input
                                    type="checkbox"
                                    id={setting.id}
                                    name={setting.id}
                                    checked={formData[setting.id as keyof User] as boolean || false}
                                    onChange={handleCheckboxChange}
                                    style={checkboxStyle}
                                />
                                {setting.label}
                            </label>
                        ))}
                    </div>

                    {/* Other Information Section (Read-only) */}
                    <h2 style={sectionTitleStyle}>Account Information</h2>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={infoRowStyle}>
                            <span style={infoLabelStyle}>User ID:</span>
                            <p style={infoValueStyle}>{formData.id}</p>
                        </div>
                        <div style={infoRowStyle}>
                            <span style={infoLabelStyle}>Email Address:</span>
                            <p style={infoValueStyle}>{formData.email}</p>
                        </div>
                        <div style={infoRowStyle}>
                            <span style={infoLabelStyle}>Last Login:</span>
                            <p style={infoValueStyle}>{formatTimestamp(formData.lastLoginAt)}</p>
                        </div>
                        <div style={infoRowStyle}>
                            <span style={infoLabelStyle}>Member Since:</span>
                            <p style={infoValueStyle}>{formatTimestamp(formData.createdAt)}</p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        gap: '1rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <button 
                            type="submit" 
                            disabled={!hasChanges || isSaving}
                            style={
                                !hasChanges || isSaving 
                                    ? disabledButtonStyle 
                                    : primaryButtonStyle
                            }
                            onMouseEnter={(e) => {
                                if (hasChanges && !isSaving) {
                                    Object.assign(e.currentTarget.style, primaryButtonHoverStyle);
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (hasChanges && !isSaving) {
                                    Object.assign(e.currentTarget.style, primaryButtonStyle);
                                }
                            }}
                        >
                            {isSaving ? (
                                <>
                                    <div style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        border: '2px solid transparent', 
                                        borderTop: '2px solid currentColor', 
                                        borderRadius: '50%', 
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>

                {/* Add CSS animation for spinner */}
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        </div>
    );
};

export default EditProfilePage;