import React, { useState } from "react";
import {
    CreateVideoRequest,
    CreateVideoResponse,
    GrpcWebImpl,
    VideoServiceClientImpl
} from "../../grpc/gen/video";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

const videoClient = new VideoServiceClientImpl(transport);

const UploadVideoPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [videoURL, setVideoURL] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const buffer = await file.arrayBuffer();
        const request: CreateVideoRequest = {
            userId: 1, // 🔧 Example user ID — change as needed
            caption: caption,
            duration: 60, // Example duration, adjust as needed
            privacy: "public",
            allowComments: true,
            allowDuet: true,
            allowStitch: true,
            videoData: new Uint8Array(buffer),
            contentType: file.type, // e.g. "video/mp4"
            videoUrl: "", // Placeholder, adjust as needed
            thumbnailUrl: "", // Placeholder, adjust as needed
        };

        try {
        const response: CreateVideoResponse = await videoClient.CreateVideo(request, new BrowserHeaders());
        // Adjust the following line according to the actual structure of CreateVideoResponse
        // For example, if response.video?.videoUrl exists:
        const url = response.video?.videoUrl ?? "";
        if (url) {
            setVideoURL(url);
        }
        } catch (err: any) {
        console.error("Upload failed:", err?.message || err);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
        <h2>Upload Video Test</h2>

        <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <br />
        <input
            type="text"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
        />
        <br />
        <button onClick={handleUpload} disabled={!file || loading}>
            {loading ? "Uploading..." : "Upload Video"}
        </button>

        {videoURL && (
            <div style={{ marginTop: "1rem" }}>
            <h3>Uploaded Video:</h3>
            <video src={videoURL} controls width="480" />
            <p>{videoURL}</p>
            </div>
        )}
        </div>
    );
};

export default UploadVideoPage;
