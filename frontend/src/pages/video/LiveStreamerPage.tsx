import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Clock,
  Settings,
  MessageCircle,
  Send,
  Heart,
  Monitor,
  StopCircle,
  Play,
  AlertCircle,
  UserPlus,
  MoreVertical,
} from "lucide-react";
import { liveClient } from "../../api/grpc/liveClient";
import { JoinRequest, SignalMessage } from "../../api/gen/live";
import { useAuth } from "../../utils/AuthProvider";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isStreamer?: boolean;
  isSystemMessage?: boolean;
}

interface StreamStats {
  viewerCount: number;
  likeCount: number;
  duration: number;
  isLive: boolean;
}

const LiveStreamerPage: React.FC = () => {
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // WebRTC state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const pendingCandidates = useRef<Map<number, RTCIceCandidate[]>>(new Map());
  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());
  const [localUserId, setLocalUserId] = useState<number>(0);

  // Stream controls
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const [streamTitle, setStreamTitle] = useState("My Live Stream");
  // const [streamDescription, setStreamDescription] = useState("")

  // Stream stats
  const [stats, setStats] = useState<StreamStats>({
    viewerCount: 0,
    likeCount: 0,
    duration: 0,
    isLive: false,
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      username: "System",
      message: "Stream chat is ready!",
      timestamp: new Date(),
      isSystemMessage: true,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "live" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Set local user ID
  useEffect(() => {
    if (user) {
      setLocalUserId(Number(user.id));
    }
  }, [user]);

  // Setup camera/mic and listen to viewers
  useEffect(() => {
    const setup = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
        setConnectionStatus("idle");
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError("Failed to access camera/microphone");
        setConnectionStatus("error");
      }
    };

    if (localUserId) {
      setup();
    }
  }, [localUserId]);

  // Join room and handle viewer connections
  const joinRoom = () => {
    if (!localUserId) return;

    const req = JoinRequest.fromPartial({ userId: localUserId });

    liveClient.JoinRoom(req).subscribe({
      next: async (message: SignalMessage) => {
        const type = message.type;
        const viewerId = Number(message.sender);

        try {
          // Viewer wants to join the live stream
          if (type === "viewer-join") {
            console.log(`Viewer ${viewerId} joined`);

            const pc = new RTCPeerConnection({
              iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });

            peerConnections.current.set(viewerId, pc);

            const streamToSend = activeStream || stream;
            if (streamToSend) {
              streamToSend.getTracks().forEach((track) => pc.addTrack(track, streamToSend));
            }

            pc.onicecandidate = (event) => {
              if (event.candidate) {
                const candidateMsg = SignalMessage.fromPartial({
                  sender: localUserId,
                  receiver: viewerId,
                  type: "candidate",
                  sdpOrCandidate: JSON.stringify(event.candidate),
                });
                liveClient.SendSignal(candidateMsg);
              }
            };

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const offerMsg = SignalMessage.fromPartial({
              sender: localUserId,
              receiver: viewerId,
              type: "offer",
              sdpOrCandidate: JSON.stringify(offer),
            });

            liveClient.SendSignal(offerMsg);

            // Update viewer count
            setStats((prev) => ({ ...prev, viewerCount: prev.viewerCount + 1 }));

            // Add join message to chat
            const joinMessage: ChatMessage = {
              id: Date.now().toString(),
              username: "System",
              message: `Viewer joined the stream`,
              timestamp: new Date(),
              isSystemMessage: true,
            };
            setChatMessages((prev) => [...prev.slice(-49), joinMessage]);

            const metadataSignal = SignalMessage.fromPartial({
              sender: localUserId,
              receiver: viewerId,
              type: "stream-metadata",
              sdpOrCandidate: JSON.stringify(
                (activeStream || stream)?.getTracks().map((track) => ({
                  id: track.id,
                  kind: track.kind,
                  label: track.label,
                  role:
                    track.kind === "video"
                      ? (track.label.toLowerCase().includes("screen") || track.label.toLowerCase().includes("window")
                          ? "screen"
                          : "webcam")
                      : "audio",
                })) || []
              ),
            });
            liveClient.SendSignal(metadataSignal);
          }

          if (type === "answer") {
            const pc = peerConnections.current.get(viewerId);
            if (pc && message.sdpOrCandidate) {
              await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.sdpOrCandidate)));

              // Apply any pending ICE candidates
              const queued = pendingCandidates.current.get(viewerId);
              if (queued) {
                for (const candidate of queued) {
                  await pc.addIceCandidate(candidate);
                }
                pendingCandidates.current.delete(viewerId);
              }
            }
          }

          if (type === "candidate" && message.sdpOrCandidate) {
            const pc = peerConnections.current.get(viewerId);
            const candidate = new RTCIceCandidate(JSON.parse(message.sdpOrCandidate));

            if (pc) {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(candidate);
              } else {
                // Queue it for later
                const existing = pendingCandidates.current.get(viewerId) || [];
                pendingCandidates.current.set(viewerId, [...existing, candidate]);
              }
            }
          }

          // Handle chat messages from viewers
          if (type === "chat" && message.sdpOrCandidate) {
            const chatData = JSON.parse(message.sdpOrCandidate);
            const newChatMessage: ChatMessage = {
              id: Date.now().toString(),
              username: chatData.username || "Viewer",
              message: chatData.message,
              timestamp: new Date(),
            };
            setChatMessages((prev) => [...prev.slice(-49), newChatMessage]);
          }

          // Handle likes
          if (type === "like") {
            setStats((prev) => ({
              ...prev,
              likeCount:
                message.sdpOrCandidate === "like" ? prev.likeCount + 1 : prev.likeCount - 1,
            }));
          }
        } catch (err) {
          console.error("Error handling signal:", err);
        }
      },
      error: (err: Error) => {
        console.error("JoinRoom error:", err);
        setConnectionStatus("error");
        setError("Failed to connect to streaming service");
      },
      complete: () => {
        console.log("JoinRoom stream closed");
        setConnectionStatus("idle");
      },
    });
  };

  // Start streaming
  const startStreaming = () => {
    if (!stream) {
      setError("No media stream available");
      return;
    }

    setConnectionStatus("connecting");
    setIsStreaming(true);
    setStats((prev) => ({ ...prev, isLive: true }));

    joinRoom();

    setTimeout(() => {
      setConnectionStatus("live");
    }, 1000);

    // Add start message to chat
    const startMessage: ChatMessage = {
      id: Date.now().toString(),
      username: "System",
      message: "Stream started! Welcome everyone!",
      timestamp: new Date(),
      isSystemMessage: true,
    };
    setChatMessages((prev) => [...prev, startMessage]);
  };

  // Stop streaming
  const stopStreaming = () => {
    setIsStreaming(false);
    setConnectionStatus("idle");
    setStats((prev) => ({ ...prev, isLive: false, duration: 0, viewerCount: 0 }));

    // Close all peer connections
    peerConnections.current.forEach((pc) => pc.close());
    stream?.getTracks().forEach((track) => track.stop());
    peerConnections.current.clear();

    // Add stop message to chat
    const stopMessage: ChatMessage = {
      id: Date.now().toString(),
      username: "System",
      message: "Stream ended. Thank you for watching!",
      timestamp: new Date(),
      isSystemMessage: true,
    };
    setChatMessages((prev) => [...prev, stopMessage]);
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });

      const screenTrack = screenStream.getVideoTracks()[0];
      const webcamTrack = webcamStream.getVideoTracks()[0];
      const audioTracks = stream?.getAudioTracks() || [];

      const combined = new MediaStream([screenTrack, webcamTrack, ...audioTracks]);

      // Set combined stream for future peer usage
      setActiveStream(combined);

      // Replace tracks in all existing peer connections
      peerConnections.current.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          pc.removeTrack(sender);
        });

        combined.getTracks().forEach((track) => pc.addTrack(track, combined));
      });

      console.log("Combined stream tracks:", combined.getTracks());

      peerConnections.current.forEach((_pc, viewerId) => {
        const metadataSignal = SignalMessage.fromPartial({
          sender: localUserId,
          receiver: viewerId,
          type: "stream-metadata",
          sdpOrCandidate: JSON.stringify(
            combined.getTracks().map((track) => ({
              id: track.id,
              kind: track.kind,
              label: track.label,
              role:
                track.kind === "video"
                  ? track.label.toLowerCase().includes("screen") || track.label.toLowerCase().includes("window")
                    ? "screen"
                    : "webcam"
                  : "audio",
            }))
          ),
        });
        liveClient.SendSignal(metadataSignal);
      });

      // Set screen for main view
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Set webcam PiP
      setWebcamStream(webcamStream);
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        webcamStream.getTracks().forEach((t) => t.stop());
        screenStream.getTracks().forEach((t) => t.stop());

        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;

        setIsScreenSharing(false);
        setActiveStream(null);
      };

    } catch (err) {
      console.error("Screen share failed", err);
    }
  };

  useEffect(() => {
    if (isScreenSharing && webcamStream && webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = webcamStream
    }
  }, [isScreenSharing, webcamStream])

  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Update duration timer
  useEffect(() => {
    if (stats.isLive) {
      const interval = setInterval(() => {
        setStats((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [stats.isLive]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        username: user?.username || "Streamer",
        message: newMessage.trim(),
        timestamp: new Date(),
        isStreamer: true,
      };

      setChatMessages((prev) => [...prev, message]);

      // Broadcast message to all viewers
      peerConnections.current.forEach((_pc, viewerId) => {
        const chatSignal = SignalMessage.fromPartial({
          sender: localUserId,
          receiver: viewerId,
          type: "chat",
          sdpOrCandidate: JSON.stringify({
            username: user?.username || "Streamer",
            message: newMessage.trim(),
            isStreamer: true,
          }),
        });
        liveClient.SendSignal(chatSignal);
      });

      setNewMessage("");
    }
  };

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
              🎥
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
                Live Streaming Studio
              </h1>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#8b949e" }}>
                {user?.username || "Streamer"} • Broadcasting
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Stream Status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.75rem",
                background:
                  connectionStatus === "live"
                    ? "rgba(239, 68, 68, 0.2)"
                    : connectionStatus === "connecting"
                      ? "rgba(251, 191, 36, 0.2)"
                      : connectionStatus === "error"
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(75, 85, 99, 0.2)",
                border: `1px solid ${
                  connectionStatus === "live"
                    ? "rgba(239, 68, 68, 0.3)"
                    : connectionStatus === "connecting"
                      ? "rgba(251, 191, 36, 0.3)"
                      : connectionStatus === "error"
                        ? "rgba(239, 68, 68, 0.3)"
                        : "rgba(75, 85, 99, 0.3)"
                }`,
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "600",
                color:
                  connectionStatus === "live"
                    ? "#ef4444"
                    : connectionStatus === "connecting"
                      ? "#fbbf24"
                      : connectionStatus === "error"
                        ? "#ef4444"
                        : "#6b7280",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background:
                    connectionStatus === "live"
                      ? "#ef4444"
                      : connectionStatus === "connecting"
                        ? "#fbbf24"
                        : connectionStatus === "error"
                          ? "#ef4444"
                          : "#6b7280",
                  animation: connectionStatus === "live" ? "pulse 2s infinite" : "none",
                }}
              />
              {connectionStatus === "live"
                ? "LIVE"
                : connectionStatus === "connecting"
                  ? "CONNECTING"
                  : connectionStatus === "error"
                    ? "ERROR"
                    : "OFFLINE"}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.5rem",
                color: "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

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
            flex: "1",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Live Stream Preview */}
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
            {/* Webcam or Screen Full View */}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Webcam PiP only if screen sharing */}
            {isScreenSharing && (
              <video
                ref={webcamVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                  position: "absolute",
                  top: "1rem",
                  left: "1rem",
                  width: "180px",
                  height: "120px",
                  borderRadius: "8px",
                  border: "2px solid white",
                  background: "#000",
                  objectFit: "cover",
                }}
              />
            )}

            {/* Video disabled overlay */}
            {!isVideoEnabled && (
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
                <VideoOff size={48} style={{ color: "#ef4444" }} />
                <p style={{ margin: 0, color: "#8b949e" }}>Camera is off</p>
              </div>
            )}

            {/* Stream Controls Overlay */}
            <div
              style={{
                position: "absolute",
                bottom: "1rem",
                left: "1rem",
                right: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                padding: "1rem",
              }}
            >
              {/* Media Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={toggleVideo}
                  style={{
                    background: isVideoEnabled
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                    border: `1px solid ${isVideoEnabled ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: isVideoEnabled ? "#22c55e" : "#ef4444",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                <button
                  onClick={toggleAudio}
                  style={{
                    background: isAudioEnabled
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                    border: `1px solid ${isAudioEnabled ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: isAudioEnabled ? "#22c55e" : "#ef4444",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <button
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                  onClick={startScreenShare}
                >
                  <Monitor size={20} />
                </button>
              </div>

              {/* Stream Control */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {!isStreaming ? (
                  <button
                    onClick={startStreaming}
                    disabled={!stream || connectionStatus === "error"}
                    style={{
                      background:
                        stream && connectionStatus !== "error"
                          ? "linear-gradient(135deg, #ef4444, #dc2626)"
                          : "rgba(75, 85, 99, 0.5)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.75rem 1.5rem",
                      color: "#ffffff",
                      cursor: stream && connectionStatus !== "error" ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      opacity: stream && connectionStatus !== "error" ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => {
                      if (stream && connectionStatus !== "error") {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (stream && connectionStatus !== "error") {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    <Play size={16} />
                    Go Live
                  </button>
                ) : (
                  <button
                    onClick={stopStreaming}
                    style={{
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "8px",
                      padding: "0.75rem 1.5rem",
                      color: "#ef4444",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                    }}
                  >
                    <StopCircle size={16} />
                    End Stream
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stream Info & Stats */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: showChat ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            {/* Stream Title */}
            <div style={{ marginBottom: "1rem" }}>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Enter stream title..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: "600",
                  outline: "none",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#8b5cf6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
              />
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Users size={18} style={{ color: "#8b5cf6" }} />
                  <span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Viewers:</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                    {formatNumber(stats.viewerCount)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Heart size={18} style={{ color: "#ef4444" }} />
                  <span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Likes:</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                    {formatNumber(stats.likeCount)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Clock size={18} style={{ color: "#3b82f6" }} />
                  <span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Duration:</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                    {formatDuration(stats.duration)}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={() => setShowChat(!showChat)}
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
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                >
                  <MessageCircle size={16} />
                  {showChat ? "Hide Chat" : "Show Chat"}
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
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
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
                  Stream Chat
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
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8b949e";
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
                            color: message.isStreamer ? "#8b5cf6" : "#ffffff",
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
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                  placeholder="Send a message..."
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
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#8b5cf6";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    background: newMessage.trim()
                      ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                      : "rgba(75, 85, 99, 0.5)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: "#ffffff",
                    cursor: newMessage.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: newMessage.trim() ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (newMessage.trim()) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newMessage.trim()) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
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
          .live-streamer-container {
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
          .stream-controls {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .media-controls {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveStreamerPage;
