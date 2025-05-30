import React from "react";
// import CommentSidebar from "../components/CommentBar";
import { useVideos } from "../../../hooks/useVideos";

const VideoFeed: React.FC = () => {
    const { videos, loading } = useVideos(1, 10); // or pass page/limit dynamically
    // const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

    if (loading) {
        return <div>Loading videos...</div>;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
            {/* Video Feed Section */}
            <div className="video-feed-container" style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: '#f8f9fa',
                padding: '1rem',
            }}>
                <div className="container-md">
                    <div className="row justify-center">
                        <div className="col-12 col-md-10 col-lg-8">
                            {videos.map((video) => (
    <div
        key={video.id}
        // onClick={() => setSelectedVideoId(video.id)}
        className="mb-4 mb-md-5"
        style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }}
    >
        <video
            src={video.videoUrl} // Update to match your actual video field
            controls
            loop
            className="w-100"
            style={{
                height: 'auto',
                maxHeight: '400px',
                objectFit: 'cover',
                display: 'block'
            }}
        />
        <div className="p-3 p-md-4">
            <p className="m-0" style={{
                fontSize: '1rem',
                color: '#333',
                lineHeight: '1.5'
            }}>
                {video.description}
            </p>
            <div className="d-flex justify-between align-center mt-3">
                <div className="d-flex align-center">
                    <button className="btn btn-link mr-3" style={{ fontSize: '0.9rem' }}>👍 Like</button>
                    <button className="btn btn-link mr-3" style={{ fontSize: '0.9rem' }}>💬 Comment</button>
                    <button className="btn btn-link" style={{ fontSize: '0.9rem' }}>📤 Share</button>
                </div>
                <button className="btn btn-link" style={{ fontSize: '0.9rem' }}>📌 Save</button>
            </div>
        </div>
    </div>
))}

                        </div>
                    </div>
                </div>
            </div>

            {/* Comment Sidebar */}
            {/* <CommentSidebar /> */}
        </div>
    );
};

export default VideoFeed;
