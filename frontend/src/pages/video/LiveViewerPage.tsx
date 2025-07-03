import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Heart,
  Users,
  Clock,
  Send,
  Share2,
  MessageCircle,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  UserPlus,
  MoreVertical,
  AlertCircle,
} from "lucide-react"
import { useParams } from "react-router-dom"
import { liveClient } from "../../api/grpc/liveClient"
import { JoinRequest, SignalMessage } from "../../api/gen/live"
import { useAuth } from "../../utils/AuthProvider"
import type { GetUserByUsernameRequest, User } from "../../api/gen/user"
import { userClient } from "../../api/grpc/userClient"

interface ChatMessage {
  id: string
  username: string
  message: string
  timestamp: Date
  isStreamer?: boolean
  isSystemMessage?: boolean
}

interface LiveStreamData {
  id: string
  title: string
  streamerName: string
  streamerAvatar: string
  viewerCount: number
  likeCount: number
  duration: number
  isLive: boolean
  category: string
}

const LiveViewerPage: React.FC = () => {
  const { remoteUsername } = useParams<{ remoteUsername: string }>()
  const { user } = useAuth()

  // WebRTC refs and state
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null)
  const [localUserId, setLocalUserId] = useState<number>(0)
  const [remoteUserId, setRemoteUserId] = useState<number>(0)
  const [streamerUser, setStreamerUser] = useState<User | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "connecting",
  )

  // Stream data state
  const [streamData, setStreamData] = useState<LiveStreamData>({
    id: "stream-123",
    title: "Live Stream",
    streamerName: remoteUsername || "Unknown Streamer",
    streamerAvatar: "👤",
    viewerCount: 1,
    likeCount: 0,
    duration: 0,
    isLive: true,
    category: "Live",
  })

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      username: "System",
      message: "Welcome to the live stream!",
      timestamp: new Date(),
      isSystemMessage: true,
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Set local user ID
  useEffect(() => {
    if (user) {
      setLocalUserId(Number(user.id))
    }
  }, [user])

  // Fetch streamer information
  useEffect(() => {
    const fetchStreamer = async () => {
      if (!remoteUsername) {
        setError("No streamer username provided")
        setIsLoading(false)
        return
      }

      try {
        const req: GetUserByUsernameRequest = { username: remoteUsername }
        const res: User = await userClient.GetUserByUsername(req)

        if (res) {
          setRemoteUserId(Number(res.id))
          setStreamerUser(res)
          console.log("Streamer user: ", streamerUser);
          setStreamData((prev) => ({
            ...prev,
            streamerName: res.displayName || res.username || remoteUsername,
            title: `${res.displayName || res.username}'s Live Stream`,
          }))
        }
      } catch (err) {
        console.error("Error fetching streamer:", err)
        setError("Failed to load streamer information")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreamer()
  }, [remoteUsername])

  // WebRTC connection setup
  useEffect(() => {
    if (!localUserId || !remoteUserId) return

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    // Handle incoming video stream
    pc.ontrack = (event) => {
      console.log("Received remote stream")
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
        setConnectionStatus("connected")
      }
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateMsg = SignalMessage.fromPartial({
          sender: localUserId,
          receiver: remoteUserId,
          type: "candidate",
          sdpOrCandidate: JSON.stringify(event.candidate),
        })

        liveClient.SendSignal(candidateMsg)
      }
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState)
      switch (pc.connectionState) {
        case "connected":
          setConnectionStatus("connected")
          break
        case "disconnected":
        case "failed":
          setConnectionStatus("disconnected")
          break
        case "connecting":
          setConnectionStatus("connecting")
          break
      }
    }

    setPeerConnection(pc)

    // Join the live stream room
    const joinReq = JoinRequest.fromPartial({ userId: localUserId })

    const subscription = liveClient.JoinRoom(joinReq).subscribe({
      next: async (message: SignalMessage) => {
        console.log("Received signal:", message.type)
        const type = message.type

        try {
          if (type === "offer" && message.sdpOrCandidate) {
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.sdpOrCandidate)))

            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            const answerMsg = SignalMessage.fromPartial({
              sender: localUserId,
              receiver: remoteUserId,
              type: "answer",
              sdpOrCandidate: JSON.stringify(answer),
            })

            liveClient.SendSignal(answerMsg)
          }

          if (type === "candidate" && message.sdpOrCandidate) {
            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(message.sdpOrCandidate)))
          }

          // Handle viewer count updates
          if (type === "viewer-count" && message.sdpOrCandidate) {
            const count = Number.parseInt(message.sdpOrCandidate)
            setStreamData((prev) => ({ ...prev, viewerCount: count }))
          }

          // Handle chat messages
          if (type === "chat" && message.sdpOrCandidate) {
            const chatData = JSON.parse(message.sdpOrCandidate)
            const newChatMessage: ChatMessage = {
              id: Date.now().toString(),
              username: chatData.username || "Anonymous",
              message: chatData.message,
              timestamp: new Date(),
              isStreamer: chatData.isStreamer || false,
            }
            setChatMessages((prev) => [...prev.slice(-49), newChatMessage])
          }
        } catch (err) {
          console.error("Error handling signal:", err)
          setConnectionStatus("error")
        }
      },
      error: (err: Error) => {
        console.error("JoinRoom error:", err)
        setConnectionStatus("error")
        setError("Failed to connect to live stream")
      },
      complete: () => {
        console.log("JoinRoom stream closed")
        setConnectionStatus("disconnected")
      },
    })

    // Send viewer join notification
    const viewerJoin = SignalMessage.fromPartial({
      sender: localUserId,
      receiver: remoteUserId,
      type: "viewer-join",
    })

    liveClient.SendSignal(viewerJoin)

    // Add join notification to chat
    const joinMessage: ChatMessage = {
      id: Date.now().toString(),
      username: "System",
      message: `${user?.username || "Anonymous"} joined the stream`,
      timestamp: new Date(),
      isSystemMessage: true,
    }
    setChatMessages((prev) => [...prev, joinMessage])

    // Cleanup function
    return () => {
      subscription.unsubscribe()
      pc.close()
    }
  }, [localUserId, remoteUserId, user?.username])

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Update duration timer
  useEffect(() => {
    if (connectionStatus === "connected") {
      const interval = setInterval(() => {
        setStreamData((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [connectionStatus])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && peerConnection) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        username: user?.username || "You",
        message: newMessage.trim(),
        timestamp: new Date(),
      }

      // Add to local chat
      setChatMessages((prev) => [...prev, message])

      // Send to streamer via WebRTC signaling
      const chatSignal = SignalMessage.fromPartial({
        sender: localUserId,
        receiver: remoteUserId,
        type: "chat",
        sdpOrCandidate: JSON.stringify({
          username: user?.username || "Anonymous",
          message: newMessage.trim(),
          isStreamer: false,
        }),
      })

      liveClient.SendSignal(chatSignal)
      setNewMessage("")
    }
  }

  // Handle like stream
  const handleLikeStream = () => {
    setIsLiked(!isLiked)
    setStreamData((prev) => ({
      ...prev,
      likeCount: isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
    }))

    // Send like signal to streamer
    if (peerConnection) {
      const likeSignal = SignalMessage.fromPartial({
        sender: localUserId,
        receiver: remoteUserId,
        type: "like",
        sdpOrCandidate: isLiked ? "unlike" : "like",
      })

      liveClient.SendSignal(likeSignal)
    }
  }

  // Handle share stream
  const handleShareStream = () => {
    if (navigator.share) {
      navigator.share({
        title: streamData.title,
        text: `Check out this live stream by ${streamData.streamerName}!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Handle mute/unmute
  const handleMuteToggle = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "2px solid #8b5cf6",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p>Loading live stream...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          height: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "2rem" }}>
          <AlertCircle size={48} style={{ color: "#ef4444", margin: "0 auto 1rem" }} />
          <h2 style={{ margin: "0 0 1rem 0", color: "#ef4444" }}>Stream Error</h2>
          <p style={{ margin: "0 0 1.5rem 0", color: "#8b949e" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        color: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              {streamData.streamerAvatar}
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {streamData.title}
              </h1>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#8b949e" }}>
                {streamData.streamerName} • {streamData.category}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Connection Status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.75rem",
                background:
                  connectionStatus === "connected"
                    ? "rgba(34, 197, 94, 0.2)"
                    : connectionStatus === "connecting"
                      ? "rgba(251, 191, 36, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                border: `1px solid ${
                  connectionStatus === "connected"
                    ? "rgba(34, 197, 94, 0.3)"
                    : connectionStatus === "connecting"
                      ? "rgba(251, 191, 36, 0.3)"
                      : "rgba(239, 68, 68, 0.3)"
                }`,
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "600",
                color:
                  connectionStatus === "connected"
                    ? "#22c55e"
                    : connectionStatus === "connecting"
                      ? "#fbbf24"
                      : "#ef4444",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background:
                    connectionStatus === "connected"
                      ? "#22c55e"
                      : connectionStatus === "connecting"
                        ? "#fbbf24"
                        : "#ef4444",
                  animation: connectionStatus === "connected" ? "pulse 2s infinite" : "none",
                }}
              />
              {connectionStatus === "connected"
                ? "LIVE"
                : connectionStatus === "connecting"
                  ? "CONNECTING"
                  : "DISCONNECTED"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Video Section */}
        <div
          style={{
            flex: showChat ? "1" : "1",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Video Player */}
          <div
            style={{
              position: "relative",
              aspectRatio: "16/9",
              background: "#000",
              borderRadius: showChat ? "0" : "0.75rem",
              overflow: "hidden",
              margin: showChat ? "0" : "1rem",
            }}
          >
            {/* Live Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={isMuted}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                background: "#000",
              }}
            />

            {/* Connection Status Overlay */}
            {connectionStatus !== "connected" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0, 0, 0, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {connectionStatus === "connecting" && (
                  <>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        border: "2px solid #8b5cf6",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <p style={{ margin: 0, color: "#8b949e" }}>Connecting to live stream...</p>
                  </>
                )}
                {connectionStatus === "disconnected" && (
                  <>
                    <AlertCircle size={48} style={{ color: "#ef4444" }} />
                    <p style={{ margin: 0, color: "#ef4444" }}>Stream disconnected</p>
                  </>
                )}
                {connectionStatus === "error" && (
                  <>
                    <AlertCircle size={48} style={{ color: "#ef4444" }} />
                    <p style={{ margin: 0, color: "#ef4444" }}>Connection error</p>
                  </>
                )}
              </div>
            )}

            {/* Video Controls */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(0, 0, 0, 0.8))",
                padding: "2rem 1rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: 0,
                transition: "opacity 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button
                  onClick={handleMuteToggle}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
                  }}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button
                  onClick={() => setShowChat(!showChat)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
                  }}
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
                  }}
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Stream Stats */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: showChat ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              {/* Live Stats */}
              <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Users size={18} style={{ color: "#8b5cf6" }} />
                  <span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Viewers:</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                    {formatNumber(streamData.viewerCount)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Heart size={18} style={{ color: "#ef4444" }} />
                  <span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Likes:</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>{formatNumber(streamData.likeCount)}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Clock size={18} style={{ color: "#3b82f6" }} />
                  <span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Duration:</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>{formatDuration(streamData.duration)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={handleLikeStream}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: isLiked ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${isLiked ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    color: isLiked ? "#ef4444" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLiked) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLiked) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"
                    }
                  }}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                  Like
                </button>

                <button
                  onClick={handleShareStream}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"
                  }}
                >
                  <Share2 size={16} />
                  Share
                </button>

                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <UserPlus size={16} />
                  Follow
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        {showChat && (
          <div
            style={{
              width: "350px",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <MessageCircle size={18} style={{ color: "#8b5cf6" }} />
                  Live Chat
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8b949e",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "4px",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ffffff"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8b949e"
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    padding: message.isSystemMessage ? "0.5rem" : "0",
                    background: message.isSystemMessage ? "rgba(139, 92, 246, 0.1)" : "transparent",
                    borderRadius: message.isSystemMessage ? "8px" : "0",
                    border: message.isSystemMessage ? "1px solid rgba(139, 92, 246, 0.2)" : "none",
                  }}
                >
                  {message.isSystemMessage ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.75rem",
                        color: "#8b5cf6",
                        fontWeight: "500",
                      }}
                    >
                      <UserPlus size={12} />
                      {message.message}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            color: message.isStreamer ? "#8b5cf6" : message.username === "You" ? "#3b82f6" : "#ffffff",
                          }}
                        >
                          {message.username}
                          {message.isStreamer && (
                            <span
                              style={{
                                marginLeft: "0.25rem",
                                fontSize: "0.6rem",
                                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                                color: "#ffffff",
                                padding: "0.125rem 0.25rem",
                                borderRadius: "4px",
                                fontWeight: "500",
                              }}
                            >
                              STREAMER
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: "0.6rem", color: "#6b7280" }}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          color: "#e5e7eb",
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        {message.message}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div
              style={{
                padding: "1rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={connectionStatus !== "connected"}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    opacity: connectionStatus !== "connected" ? 0.5 : 1,
                  }}
                  onFocus={(e) => {
                    if (connectionStatus === "connected") {
                      e.currentTarget.style.borderColor = "#8b5cf6"
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)"
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"
                    e.currentTarget.style.boxShadow = "none"
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || connectionStatus !== "connected"}
                  style={{
                    background:
                      newMessage.trim() && connectionStatus === "connected"
                        ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                        : "rgba(75, 85, 99, 0.5)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: "#ffffff",
                    cursor: newMessage.trim() && connectionStatus === "connected" ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: newMessage.trim() && connectionStatus === "connected" ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (newMessage.trim() && connectionStatus === "connected") {
                      e.currentTarget.style.transform = "translateY(-1px)"
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newMessage.trim() && connectionStatus === "connected") {
                      e.currentTarget.style.transform = "translateY(0)"
                      e.currentTarget.style.boxShadow = "none"
                    }
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Custom scrollbar for chat */
        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        /* Responsive design */
        @media (max-width: 1024px) {
          .live-viewer-container {
            flex-direction: column;
          }
          
          .chat-section {
            width: 100% !important;
            height: 300px;
            border-left: none !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
        }

        @media (max-width: 768px) {
          .stream-stats {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }
          
          .action-buttons {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}

export default LiveViewerPage
