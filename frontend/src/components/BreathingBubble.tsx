import type { User } from "../api/gen/user"

interface Props {
  receiver: User | null
}

const BreathingBubble = ({ receiver }: Props) => {
  return (
    <div className="breathing-bubble-container">
      {/* Breathing bubble without avatar */}
      <div className="breathing-bubble">
        <div className="typing-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <span className="typing-text">{receiver?.username || "User"} is typing</span>
      </div>

      <style>{`
        .breathing-bubble-container {
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          margin-bottom: 1rem;
        }

        .breathing-bubble {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #d1d5db;
          padding: 0.875rem 1.125rem;
          border-radius: 1.25rem;
          border-bottom-left-radius: 0.375rem;
          max-width: 70%;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: breathe 2s infinite ease-in-out;
        }

        .typing-dots {
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .dot:nth-child(1) {
          animation-delay: 0s;
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        .typing-text {
          font-size: 0.8rem;
          opacity: 0.8;
          font-style: italic;
        }

        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.02);
            opacity: 1;
          }
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .breathing-bubble {
            padding: 0.75rem 1rem;
            font-size: 0.8rem;
          }

          .typing-text {
            font-size: 0.75rem;
          }

          .dot {
            width: 5px;
            height: 5px;
          }
        }
      `}</style>
    </div>
  )
}

export default BreathingBubble
