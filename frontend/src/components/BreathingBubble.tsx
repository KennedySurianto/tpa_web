import { avatarBytesToUrl } from "../utils/avatarConverter"
import defaultAvatar from "../assets/default.jpg"
import type { User } from "../api/gen/user"

interface props {
    receiver: User | null,
}

const BreathingBubble = ({ receiver }: props) => {
    return (
        <div>
            <div
                style={{
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-end",
                    position: "relative",
                    gap: 8,
                }}
            >
                {/* Avatar for receiver */}
                <img
                    src={receiver?.avatar ? avatarBytesToUrl(receiver.avatar) || defaultAvatar : defaultAvatar}
                    alt={receiver?.username || "User"}
                    style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                    }}
                />

                {/* Breathing bubble */}
                <div
                    className="breathing-bubble"
                    style={{
                    backgroundColor: "#3a3a3a",
                    color: "white",
                    padding: "12px 16px",
                    borderRadius: 16,
                    maxWidth: "70%",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    }}
                >
                    <span style={{ fontSize: 12, opacity: 0.8 }}>{receiver?.username || "User"} is typing</span>
                </div>
            </div>

            <style>
                {`
                @keyframes breathe {
                    0%,
                    100% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 1;
                    }
                }

                .breathing-bubble {
                    animation: breathe 2s infinite ease-in-out;
                }
                `}
            </style>
        </div>
    )
}

export default BreathingBubble
