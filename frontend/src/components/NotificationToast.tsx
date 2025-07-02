import React from "react";

interface NotificationToastProps {
  message: string;
  type: "success" | "error";
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type }) => {
  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        {type === "success" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 11.08V12a10 10 0 11-5.93-9.14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 4L12 14.01l-3-3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
        <span>{message}</span>
      </div>

      <style>{`
        .notification {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1001;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          animation: slideInRight 0.3s ease-out;
          max-width: 400px;
        }

        .notification.success {
          background: #065f46;
          border: 1px solid #10b981;
          color: #ffffff;
        }

        .notification.error {
          background: #7f1d1d;
          border: 1px solid #ef4444;
          color: #ffffff;
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .notification {
            top: 16px;
            right: 16px;
            left: 16px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
