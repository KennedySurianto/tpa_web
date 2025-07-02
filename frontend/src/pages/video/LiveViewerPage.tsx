import { useEffect, useRef, useState } from "react";
import { liveClient } from "../../api/grpc/liveClient";
import { JoinRequest, SignalMessage } from "../../api/gen/live";
import { useAuth } from "../../utils/AuthProvider";
import { useParams } from "react-router-dom";
import type { GetUserByUsernameRequest, User } from "../../api/gen/user";
import { userClient } from "../../api/grpc/userClient";

const LiveViewerPage: React.FC = () => {
  const { remoteUsername } = useParams<{ remoteUsername: string }>();
  const { user } = useAuth();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localUserId, setLocalUserId] = useState<number>(0);
  const [remoteUserId, setRemoteUserId] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setLocalUserId(Number(user.id));
    }
  }, [user]);

  useEffect(() => {
    const fetchStreamer = async () => {
      if (!remoteUsername) return;

      const req: GetUserByUsernameRequest = { username: remoteUsername };
      const res: User = await userClient.GetUserByUsername(req);
      if (res) {
        setRemoteUserId(Number(res.id));
      }
    };

    fetchStreamer();
  }, [remoteUsername]);

  useEffect(() => {
    if (!localUserId || !remoteUserId) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateMsg = SignalMessage.fromPartial({
          sender: localUserId,
          receiver: remoteUserId,
          type: "candidate",
          sdpOrCandidate: JSON.stringify(event.candidate),
        });
        liveClient.SendSignal(candidateMsg);
      }
    };

    setPeerConnection(pc);

    const joinReq = JoinRequest.fromPartial({ userId: localUserId });
    liveClient.JoinRoom(joinReq).subscribe({
      next: async (message: SignalMessage) => {
        const type = message.type;

        if (type === "offer" && message.sdpOrCandidate) {
          await pc.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(message.sdpOrCandidate)),
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const answerMsg = SignalMessage.fromPartial({
            sender: localUserId,
            receiver: remoteUserId,
            type: "answer",
            sdpOrCandidate: JSON.stringify(answer),
          });
          liveClient.SendSignal(answerMsg);
        }

        if (type === "candidate" && message.sdpOrCandidate) {
          await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(message.sdpOrCandidate)));
        }
      },
      error: (err: Error) => console.error("JoinRoom error:", err),
      complete: () => console.log("JoinRoom stream closed"),
    });

    const viewerJoin = SignalMessage.fromPartial({
      sender: localUserId,
      receiver: remoteUserId,
      type: "viewer-join",
    });
    liveClient.SendSignal(viewerJoin);
  }, [localUserId, remoteUserId]);

  return (
    <div className="container text-center">
      <h1 className="my-3">📺 Live Stream (Viewer)</h1>
      <video ref={remoteVideoRef} autoPlay className="border" width="640" />
      <p className="text-muted mt-2">You are watching the live stream...</p>
    </div>
  );
};

export default LiveViewerPage;
