import React, { useRef, useState } from "react";
import {
    CreateVideoRequest,
    CreateVideoResponse,
    GrpcWebImpl,
    VideoServiceClientImpl
} from "../../../api/gen/video";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

const videoClient = new VideoServiceClientImpl(transport);

const UploadVideoPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [description, setDescription] = useState("");
    const [privacy, setPrivacy] = useState("public");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [allowComments, setAllowComments] = useState(true);
    const [allowDuet, setAllowDuet] = useState(true);
    const [allowStitch, setAllowStitch] = useState(true);
    const [videoURL, setVideoURL] = useState("");
    const [loading, setLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);

        const buffer = await file.arrayBuffer();

        // Calculate duration from video element
        let duration = 0;
        if (videoRef.current && videoRef.current.duration) {
            duration = Math.floor(videoRef.current.duration);
        }

        const request: CreateVideoRequest = {
            userId: 1, // 🔧 Replace with actual user ID from auth context
            caption,
            description,
            duration,
            privacy,
            allowComments,
            allowDuet,
            allowStitch,
            videoData: new Uint8Array(buffer),
            contentType: file.type,
            videoUrl: "", // Will be generated server-side
            thumbnailUrl,
        };

        try {
            const response: CreateVideoResponse = await videoClient.CreateVideo(request, new BrowserHeaders());
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
        <div className="container container-md py-4">
            <div className="row justify-center">
                <div className="col-12">
                    <h2 className="text-center mb-4" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        Upload Video
                    </h2>
                    
                    {/* Video Upload Section */}
                    <div className="mb-4 p-3" style={{ border: '1px solid black' }}>
                        <label className="d-block mb-2" style={{ fontWeight: 'bold' }}>
                            Select Video File
                        </label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                                const selected = e.target.files?.[0] || null;
                                setFile(selected);
                                setVideoURL("");
                            }}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid black',
                                backgroundColor: 'white'
                            }}
                        />
                    </div>

                    {/* Video Preview */}
                    {file && (
                        <div className="mb-4">
                            <video
                                ref={videoRef}
                                src={URL.createObjectURL(file)}
                                controls
                                preload="metadata"
                                className="w-100"
                                style={{ 
                                    maxHeight: '300px',
                                    border: '1px solid black',
                                    backgroundColor: 'black'
                                }}
                                onLoadedMetadata={(e) => {
                                    const duration = (e.target as HTMLVideoElement).duration;
                                    console.log("Video duration:", duration);
                                }}
                            />
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="row">
                        <div className="col-12 col-md-6 mb-3">
                            <label className="d-block mb-1" style={{ fontWeight: 'bold' }}>
                                Caption
                            </label>
                            <input
                                type="text"
                                placeholder="Enter video caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-100"
                                style={{
                                    padding: '0.75rem',
                                    border: '1px solid black',
                                    backgroundColor: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div className="col-12 col-md-6 mb-3">
                            <label className="d-block mb-1" style={{ fontWeight: 'bold' }}>
                                Privacy
                            </label>
                            <select
                                value={privacy}
                                onChange={(e) => setPrivacy(e.target.value)}
                                className="w-100"
                                style={{
                                    padding: '0.75rem',
                                    border: '1px solid black',
                                    backgroundColor: 'white',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                                <option value="friends">Friends Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="d-block mb-1" style={{ fontWeight: 'bold' }}>
                            Description
                        </label>
                        <textarea
                            placeholder="Enter video description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-100"
                            style={{
                                padding: '0.75rem',
                                border: '1px solid black',
                                backgroundColor: 'white',
                                fontSize: '1rem',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="d-block mb-1" style={{ fontWeight: 'bold' }}>
                            Thumbnail URL (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="https://example.com/thumbnail.jpg"
                            value={thumbnailUrl}
                            onChange={(e) => setThumbnailUrl(e.target.value)}
                            className="w-100"
                            style={{
                                padding: '0.75rem',
                                border: '1px solid black',
                                backgroundColor: 'white',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Permissions */}
                    <div className="mb-4 p-3" style={{ border: '1px solid black', backgroundColor: '#f9f9f9' }}>
                        <h4 className="mb-3" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            Video Permissions
                        </h4>
                        <div className="row">
                            <div className="col-12 col-sm-4 mb-2">
                                <label className="d-flex align-center" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={allowComments}
                                        onChange={(e) => setAllowComments(e.target.checked)}
                                        className="mr-2"
                                    />
                                    Allow Comments
                                </label>
                            </div>
                            <div className="col-12 col-sm-4 mb-2">
                                <label className="d-flex align-center" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={allowDuet}
                                        onChange={(e) => setAllowDuet(e.target.checked)}
                                        className="mr-2"
                                    />
                                    Allow Duet
                                </label>
                            </div>
                            <div className="col-12 col-sm-4 mb-2">
                                <label className="d-flex align-center" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={allowStitch}
                                        onChange={(e) => setAllowStitch(e.target.checked)}
                                        className="mr-2"
                                    />
                                    Allow Stitch
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="btn btn-black w-100 mb-4"
                        style={{
                            padding: '1rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            opacity: (!file || loading) ? 0.5 : 1,
                            cursor: (!file || loading) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? "Uploading..." : "Upload Video"}
                    </button>

                    {/* Upload Result */}
                    {videoURL && (
                        <div className="p-3" style={{ border: '1px solid black', backgroundColor: '#f9f9f9' }}>
                            <h4 className="mb-3" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                Upload Successful
                            </h4>
                            <video 
                                src={videoURL} 
                                controls 
                                className="w-100 mb-3"
                                style={{ 
                                    border: '1px solid black',
                                    backgroundColor: 'black'
                                }}
                            />
                            <p className="text-center" style={{ 
                                wordBreak: 'break-all',
                                fontSize: '0.9rem',
                                color: '#666'
                            }}>
                                {videoURL}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadVideoPage;
