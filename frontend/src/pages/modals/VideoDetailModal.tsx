import React from 'react';
import type { Video } from '../../api/gen/video';
import { avatarBytesToUrl } from '../../utils/avatarConverter';

interface VideoDetailModalProps {
    video: Video | null;
    isOpen: boolean;
    onClose: () => void;
}

export const VideoDetailModal: React.FC<VideoDetailModalProps> = ({ video, isOpen, onClose }) => {
    if (!isOpen || !video) return null;

    return (
        <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        }}>
        <div style={{
            backgroundColor: '#111',
            borderRadius: '12px',
            width: '50vw',
            height: '70vh',
            color: '#fff',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            boxSizing: 'border-box',
            overflow: 'hidden'
        }}>
            {/* Close Button */}
            <button onClick={onClose} style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            color: '#fff',
            fontSize: '1.5rem',
            border: 'none',
            cursor: 'pointer'
            }}>
            &times;
            </button>

            {/* Video Preview */}
            <div style={{
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderRadius: '8px',
            marginBottom: '12px',
            backgroundColor: '#000'
            }}>
            <video
                src={video.videoUrl}
                poster={avatarBytesToUrl(video.thumbnail) || video.videoUrl}
                controls
                style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '8px'
                }}
            />
            </div>

            {/* Video Info */}
            <div style={{ fontSize: '0.9rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{video.caption || 'Untitled Video'}</h3>
            <p style={{ color: '#ccc', margin: 0 }}>
                {video.description || 'No description'}
            </p>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem' }}>
                <span>👁 {video.viewsCount}</span>
                <span>🗨️ {video.commentsCount}</span>
                <span><span>{video.isLiked ? '❤️' : '🤍'}</span> {video.likeCount}</span>
            </div>
            </div>
        </div>
        </div>
    );
};
