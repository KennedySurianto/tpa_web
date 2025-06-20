import { useEffect, useRef, useState } from "react";
import { liveClient } from "../../api/grpc/liveClient";
import { JoinRequest, SignalMessage } from "../../api/gen/live";
import { useAuth } from "../../utils/AuthProvider";

const LiveStreamerPage: React.FC = () => {
    const { user } = useAuth();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());
    const [localUserId, setLocalUserId] = useState<number>(0);

    useEffect(() => {
        if (user) {
        setLocalUserId(Number(user.id));
        }
    }, [user]);

    // 1. Setup camera/mic and listen to viewers
    useEffect(() => {
        const setup = async () => {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;

        joinRoom(); // start receiving viewer requests
        };
        setup();
    }, [localUserId]);

    const joinRoom = () => {
        const req = JoinRequest.fromPartial({ userId: localUserId });

        liveClient.JoinRoom(req).subscribe({
        next: async (message: SignalMessage) => {
            const type = message.type;
            const viewerId = Number(message.sender);

            // Viewer wants to join the live stream
            if (type === "viewer-join") {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });

            peerConnections.current.set(viewerId, pc);

            stream?.getTracks().forEach((track) => pc.addTrack(track, stream));

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

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const offerMsg = SignalMessage.fromPartial({
                sender: localUserId,
                receiver: viewerId,
                type: "offer",
                sdpOrCandidate: JSON.stringify(offer),
            });
            liveClient.SendSignal(offerMsg);
            }

            if (type === "answer") {
            const pc = peerConnections.current.get(viewerId);
            if (pc && message.sdpOrCandidate) {
                await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.sdpOrCandidate)));
            }
            }

            if (type === "candidate") {
            const pc = peerConnections.current.get(viewerId);
            if (pc && message.sdpOrCandidate) {
                await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(message.sdpOrCandidate)));
            }
            }
        },
        error: (err: Error) => console.error("JoinRoom error:", err),
        complete: () => console.log("JoinRoom stream closed"),
        });
    };

    return (
        <div className="container text-center">
        <h1 className="my-3">🎥 Live Stream (Streamer)</h1>
        <video ref={localVideoRef} autoPlay muted className="border" width="640" />
        <p className="text-muted mt-2">You are broadcasting...</p>
        </div>
    );
};

export default LiveStreamerPage;
