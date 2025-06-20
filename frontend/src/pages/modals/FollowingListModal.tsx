import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FollowItem, FollowList } from '../../api/gen/follow';
import { followClient } from '../../api/grpc/followClient';
import { avatarBytesToUrl } from '../../utils/avatarConverter';
import defaultAvatar from "../../assets/default.jpg";

interface FollowingListModalProps {
    userId: number;
    isOpen: boolean;
    onClose: () => void;
}

export const FollowingListModal: React.FC<FollowingListModalProps> = ({ userId, isOpen, onClose }) => {
    const [following, setFollowing] = useState<FollowItem[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) return;
        followClient.GetFollowing({ userId }).then((res: FollowList) => {
        setFollowing(res.follows);
        });
    }, [isOpen, userId]);

    if (!isOpen) return null;

    return (
        <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 9999,
        }}>
        <div style={{
            backgroundColor: '#111', borderRadius: '12px',
            width: '50vw', height: '70vh', color: '#fff',
            position: 'relative', display: 'flex',
            flexDirection: 'column', padding: '16px', boxSizing: 'border-box',
            overflowY: 'auto'
        }}>
            <button onClick={onClose} style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'transparent', color: '#fff',
            fontSize: '1.5rem', border: 'none', cursor: 'pointer'
            }}>&times;</button>

            <h2>Following</h2>
            {following.map((f, idx) => (
            <div key={idx} style={{
                display: 'flex', alignItems: 'center',
                marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px'
            }}>
                <img src={f.user?.avatar ? avatarBytesToUrl(f.user?.avatar) || defaultAvatar : defaultAvatar} alt="avatar"
                style={{ width: 40, height: 40, borderRadius: '50%', marginRight: '12px' }} />
                <span style={{ flex: 1 }}>{f.user?.username}</span>
                <button
                onClick={() => {
                    onClose();
                    navigate(`/${f.user?.username}`)
                }}
                style={{
                    backgroundColor: '#444', color: '#fff', border: 'none',
                    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'
                }}
                >View Profile</button>
            </div>
            ))}
        </div>
        </div>
    );
};
