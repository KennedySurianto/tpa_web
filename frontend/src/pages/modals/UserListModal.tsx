import type React from "react";
import { useNavigate } from "react-router-dom";
import { avatarBytesToUrl } from "../../utils/avatarConverter";
import defaultAvatar from "../../assets/default.jpg";
import { X, Users, ExternalLink, CheckCircle } from "lucide-react";
import type { User } from "../../api/gen/user";

interface UserListModalProps {
  users: User[];
  label: string;
  verb: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  users,
  label,
  verb,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="header-content">
            <Users size={20} className="header-icon" />
            <h2 className="modal-title">{label}</h2>
            <span className="count-badge">{users.length}</span>
          </div>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {users.length === 0 ? (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <h3>No {label} Yet</h3>
              <p>This user isn't {verb} anyone yet</p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((u, idx) => (
                <div key={idx} className="users-item">
                  <div className="user-info">
                    <div className="avatar-container">
                      <img
                        src={u.avatar ? avatarBytesToUrl(u.avatar) || defaultAvatar : defaultAvatar}
                        alt="avatar"
                        className="user-avatar"
                      />
                      {u.isVerified && (
                        <div className="verification-badge">
                          <CheckCircle size={12} />
                        </div>
                      )}
                    </div>
                    <div className="user-details">
                      <span className="username">@{u.username}</span>
                      {u.displayName && <span className="display-name">{u.displayName}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/${u.username}`);
                    }}
                    className="view-profile-button"
                  >
                    <ExternalLink size={16} />
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 1rem;
          overflow: hidden;
        }

        .modal-container {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          flex-shrink: 0;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
          flex: 1;
        }

        .header-icon {
          color: #8b5cf6;
          flex-shrink: 0;
        }

        .modal-title {
          margin: 0;
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          min-width: 0;
          flex-shrink: 0;
        }

        .count-badge {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(139, 92, 246, 0.3);
          flex-shrink: 0;
          white-space: nowrap;
        }

        .close-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #8b949e;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transform: scale(1.05);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
        }

        .modal-body::-webkit-scrollbar {
          width: 6px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .modal-body::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
          color: #8b949e;
        }

        .empty-icon {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .empty-state p {
          margin: 0;
          font-size: 1rem;
          line-height: 1.5;
        }

        .users-list {
          padding: 0.5rem 0;
        }

        .users-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
          cursor: pointer;
          min-width: 0;
          box-sizing: border-box;
        }

        .users-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .users-item:last-child {
          border-bottom: none;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .users-item:hover .user-avatar {
          border-color: rgba(139, 92, 246, 0.5);
        }

        .verification-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #3b82f6;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #1a1a1a;
          color: #ffffff;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }

        .username {
          color: #ffffff;
          font-weight: 600;
          font-size: 0.95rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .display-name {
          color: #8b949e;
          font-size: 0.85rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .view-profile-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          border: none;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.85rem;
          font-weight: 500;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .view-profile-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .view-profile-button:active {
          transform: translateY(0);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0.5rem;
          }

          .modal-container {
            max-width: 95vw;
            max-height: 90vh;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-title {
            font-size: 1.1rem;
          }

          .users-item {
            padding: 0.75rem 1rem;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
          }

          .verification-badge {
            width: 16px;
            height: 16px;
          }

          .view-profile-button {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .modal-container {
            max-width: 100vw;
            max-height: 95vh;
            border-radius: 12px 12px 0 0;
          }

          .header-content {
            gap: 0.5rem;
          }

          .count-badge {
            padding: 0.2rem 0.6rem;
            font-size: 0.75rem;
          }

          .users-item {
            padding: 0.75rem;
          }

          .user-details {
            gap: 0.1rem;
          }

          .username {
            font-size: 0.9rem;
          }

          .display-name {
            font-size: 0.8rem;
          }

          .view-profile-button {
            padding: 0.4rem 0.7rem;
            font-size: 0.75rem;
            gap: 0.25rem;
          }

          .empty-state {
            padding: 2rem 1rem;
          }

          .empty-state h3 {
            font-size: 1.1rem;
          }

          .empty-state p {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};
