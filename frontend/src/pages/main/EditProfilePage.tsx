import React, { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
// Assuming these imports are correct for your project structure
import type { GetUserByIdRequest, User } from '../../api/gen/user'; // Make sure this path is correct
import { useAuth } from '../../utils/AuthProvider'; // Make sure this path is correct
import { userClient } from '../../api/grpc/userClient'; // Make sure this path is correct
import { useNavigate } from 'react-router-dom';

// Assuming index.css is linked in the HTML file that runs this React app.
// We will use its classes directly.

// Helper function to format Unix timestamps
const formatTimestamp = (timestampStr: string | undefined): string => {
  if (!timestampStr) return 'N/A';
  const timestampNum = parseInt(timestampStr, 10);
  if (isNaN(timestampNum)) {
    return 'Invalid date';
  }
  return new Date(timestampNum * 1000).toLocaleString();
};

// Styles for form elements (as index.css doesn't fully cover them)
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #D0D5DD', // A light grey border
  borderRadius: '8px',
  boxSizing: 'border-box',
  fontSize: '1rem',
  color: '#333', // Darker text for readability
  backgroundColor: '#FFFFFF', // White background
};

const labelStyle: React.CSSProperties = {
  fontWeight: '500', // Medium weight for labels
  display: 'block',
  marginBottom: '6px', // Space below label
  color: '#344054', // Dark grey for label text
};

const checkboxLabelStyle: React.CSSProperties = {
  marginLeft: '8px',
  fontSize: '0.95rem',
  color: '#344054',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem', // Larger for section titles
  color: '#101828', // Very dark grey, almost black
  borderBottom: '1px solid #EAECF0', // Light separator line
  paddingBottom: '10px',
  marginBottom: '20px',
  marginTop: '30px', // Space above section title
};

const pageTitleStyle: React.CSSProperties = {
    fontSize: '2rem',
    color: '#101828',
    marginBottom: '25px',
};

const infoTextStyle: React.CSSProperties = {
    color: '#475467', // Medium grey for info text
    fontSize: '0.95rem',
};

const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '1.2rem',
    color: '#475467',
};


const EditProfilePage: React.FC = () => {
    const authUser = useAuth().user; // Renamed to avoid conflict with User type if imported directly
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [formData, setFormData] = useState<User | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Effect to fetch user data
    useEffect(() => {
        const fetchUser = async () => {
        setIsLoading(true);
        if (!(authUser && authUser.id)) {
            console.warn('No authenticated user ID found.');
            setUserProfile(null); // Explicitly set to null if no authUser
            setIsLoading(false);
            return;
        }

        try {
            const req: GetUserByIdRequest = { id: authUser.id };
            // Ensure userClient.GetUserById is correctly defined and returns a Promise<User>
            const res: User = await userClient.GetUserById(req);
            console.log('Fetched user data:', res);
            setUserProfile(res);
        } catch (err) {
            console.error('Error fetching user:', err);
            setUserProfile(null); // Set to null on error
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
        setAvatarPreview(userProfile.avatarUrl || `https://placehold.co/150x150/E0E0E0/333?text=Avatar&font=Inter`);
        } else {
        // If userProfile is null (e.g. initial load, error, or no authUser), clear formData
        setFormData(null);
        setAvatarPreview(`https://placehold.co/150x150/E0E0E0/333?text=Avatar&font=Inter`);
        }
    }, [userProfile]);


    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => (prev ? { ...prev, [name]: value } : null));
        if (name === 'avatarUrl') {
        setAvatarPreview(value);
        }
    };

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => (prev ? { ...prev, [name]: checked } : null));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData) {
            console.error('Form data is not available.');
            alert('Error: Profile data not loaded.');
            return;
        }
        console.log('Form submitted:', formData);
        // Here you would typically send the formData to your backend API
        // Example: await userClient.UpdateUser(formData);
        alert('Profile changes saved! (Check console for data)');
    };
    
    const handleAvatarError = () => {
        setAvatarPreview(`https://placehold.co/150x150/FFCDD2/D32F2F?text=Error&font=Inter`);
    };

    if (isLoading) {
        return (
            <div className="container container-lg py-4" style={{ fontFamily: 'Inter, Arial, sans-serif', backgroundColor: '#F9FAFB', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                <h1 style={pageTitleStyle}>Edit Profile</h1>
                <div style={loadingStyle}>Loading profile...</div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="container container-lg py-4" style={{ fontFamily: 'Inter, Arial, sans-serif', backgroundColor: '#F9FAFB', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                <h1 style={pageTitleStyle}>Edit Profile</h1>
                <div style={loadingStyle}>Could not load profile data. Please try again later.</div>
            </div>
        );
    }

    return (
        <div 
            className="py-4" 
            style={{ 
                height: '100vh',
                overflowY: 'auto',
                fontFamily: 'Inter, Arial, sans-serif', 
                backgroundColor: '#F9FAFB', 
                padding: '2rem', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
            }}
        >
        <h1 style={pageTitleStyle}>Edit Profile</h1>

        <form onSubmit={handleSubmit}>
            {/* Avatar Section */}
            <div className="row mb-4 align-center">
            <div className="col col-md-3">
                <label style={labelStyle}>Profile Picture</label>
                <img
                src={avatarPreview}
                alt="Avatar Preview"
                onError={handleAvatarError}
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #E0E0E0' }}
                className="mb-2"
                />
            </div>
            <div className="col col-md-9">
                <label htmlFor="avatarUrl" style={labelStyle}>Avatar URL</label>
                <input
                type="text"
                id="avatarUrl"
                name="avatarUrl"
                value={formData.avatarUrl || ''}
                onChange={handleChange}
                style={inputStyle}
                placeholder="https://example.com/avatar.png"
                />
            </div>
            </div>

            {/* Personal Information Section */}
            <h2 style={sectionTitleStyle}>Personal Information</h2>
            <div className="row mb-3">
            <div className="col col-md-6">
                <label htmlFor="username" style={labelStyle}>Username</label>
                <input
                type="text"
                id="username"
                name="username"
                value={formData.username || ''}
                onChange={handleChange}
                style={inputStyle}
                />
            </div>
            <div className="col col-md-6">
                <label htmlFor="displayName" style={labelStyle}>Display Name</label>
                <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName || ''}
                onChange={handleChange}
                style={inputStyle}
                />
            </div>
            </div>
            <div className="row mb-3">
            <div className="col col-md-6">
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                style={inputStyle}
                />
            </div>
            <div className="col col-md-6">
                <label htmlFor="country" style={labelStyle}>Country</label>
                <input
                type="text"
                id="country"
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                style={inputStyle}
                />
            </div>
            </div>
            <div className="row mb-3">
            <div className="col col-12">
                <label htmlFor="bio" style={labelStyle}>Bio</label>
                <textarea
                id="bio"
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                rows={4}
                />
            </div>
            </div>

            {/* Account Settings Section */}
            <h2 style={sectionTitleStyle}>Account Settings</h2>
            <div className="row mb-3 align-center">
            <div className="col col-md-6">
                <label style={labelStyle}>Password</label>
                <button 
                    type="button" 
                    className="btn btn-white" 
                    style={{padding: '10px 15px', fontSize: '0.95rem'}} 
                    onClick={() => navigate('/forgot-password')}
                >
                    Change Password
                </button>
            </div>
            <div className="col col-md-6 d-flex align-center" style={{paddingTop: '28px'}}> {/* Align with button */}
                <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={formData.isPrivate || false}
                onChange={handleCheckboxChange}
                style={{ width: '20px', height: '20px', marginRight: '8px', accentColor: '#7F56D9' }}
                />
                <label htmlFor="isPrivate" style={{...checkboxLabelStyle, marginBottom: 0, fontWeight: 'normal' }}>Private Account</label>
            </div>
            </div>

            {/* Content Settings Section */}
            <h2 style={sectionTitleStyle}>Content Settings</h2>
            <div className="row mb-3">
            {[
                { id: 'allowComments', label: 'Allow Comments' },
                { id: 'allowDuet', label: 'Allow Duet' },
                { id: 'allowStitch', label: 'Allow Stitch' },
                { id: 'allowDownload', label: 'Allow Download of Your Content' },
            ].map(setting => (
                <div className="col col-md-6 mb-2 d-flex align-center" key={setting.id}>
                <input
                    type="checkbox"
                    id={setting.id}
                    name={setting.id}
                    checked={formData[setting.id as keyof User] as boolean || false}
                    onChange={handleCheckboxChange}
                    style={{ width: '20px', height: '20px', marginRight: '8px', accentColor: '#7F56D9' }}
                />
                <label htmlFor={setting.id} style={{...checkboxLabelStyle, marginBottom: 0, fontWeight: 'normal' }}>{setting.label}</label>
                </div>
            ))}
            </div>

            {/* Other Information Section (Read-only) */}
            <h2 style={sectionTitleStyle}>Other Information</h2>
            <div className="row mb-2">
            <div className="col col-md-3"><strong style={labelStyle}>User ID:</strong></div>
            <div className="col col-md-9"><p style={infoTextStyle}>{formData.id}</p></div>
            </div>
            <div className="row mb-2">
            <div className="col col-md-3"><strong style={labelStyle}>Account Status:</strong></div>
            <div className="col col-md-9"><p style={infoTextStyle}>{formData.isActive ? 'Active' : 'Inactive'}</p></div>
            </div>
            <div className="row mb-2">
            <div className="col col-md-3"><strong style={labelStyle}>Verified:</strong></div>
            <div className="col col-md-9"><p style={infoTextStyle}>{formData.isVerified ? 'Yes' : 'No'}</p></div>
            </div>
            <div className="row mb-2">
            <div className="col col-md-3"><strong style={labelStyle}>Last Login:</strong></div>
            <div className="col col-md-9"><p style={infoTextStyle}>{formatTimestamp(formData.lastLoginAt)}</p></div>
            </div>
            <div className="row mb-2">
            <div className="col col-md-3"><strong style={labelStyle}>Member Since:</strong></div>
            <div className="col col-md-9"><p style={infoTextStyle}>{formatTimestamp(formData.createdAt)}</p></div>
            </div>
            <div className="row mb-2">
            <div className="col col-md-3"><strong style={labelStyle}>Profile Last Updated:</strong></div>
            <div className="col col-md-9"><p style={infoTextStyle}>{formatTimestamp(formData.updatedAt)}</p></div>
            </div>

            {/* Submit Button */}
            <div className="mt-5 d-flex justify-end">
            <button type="submit" className="btn btn-black" style={{padding: '12px 25px', fontSize: '1rem'}}>
                Save Changes
            </button>
            </div>
        </form>
        </div>
    );
};

export default EditProfilePage;
