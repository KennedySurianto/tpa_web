import React from "react";

const dummyVideos = [
    { id: 1, src: "/videos/sample1.mp4", description: "Amazing sunset timelapse from the mountains" },
    { id: 2, src: "/videos/sample2.mp4", description: "Street food cooking techniques from around the world" },
    { id: 3, src: "/videos/sample3.mp4", description: "Wildlife photography in the African savanna" },
    { id: 4, src: "/videos/sample4.mp4", description: "Urban architecture and modern design trends" },
    { id: 5, src: "/videos/sample5.mp4", description: "Ocean waves and marine life exploration" },
];

const VideoFeed: React.FC = () => {
    return (
        <div className="d-flex flex-column align-center p-3 p-md-4 p-lg-5"
             style={{
                 marginLeft: '250px',
                 minHeight: '100vh',
                 backgroundColor: '#f8f9fa'
             }}>
            
            <div className="container-md">
                <div className="row justify-center">
                    <div className="col-12 col-md-10 col-lg-8">
                        
                        {dummyVideos.map((video) => (
                            <div key={video.id} 
                                 className="mb-4 mb-md-5"
                                 style={{
                                     backgroundColor: 'white',
                                     borderRadius: '12px',
                                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                     overflow: 'hidden',
                                     transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                 }}
                                 onMouseEnter={(e) => {
                                     e.currentTarget.style.transform = 'translateY(-4px)';
                                     e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
                                 }}
                                 onMouseLeave={(e) => {
                                     e.currentTarget.style.transform = 'translateY(0)';
                                     e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                 }}>
                                
                                <video 
                                    src={video.src} 
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
                                    <p className="m-0" 
                                       style={{
                                           fontSize: '1rem',
                                           color: '#333',
                                           lineHeight: '1.5'
                                       }}>
                                        {video.description}
                                    </p>
                                    
                                    {/* Action buttons */}
                                    <div className="d-flex justify-between align-center mt-3">
                                        <div className="d-flex align-center">
                                            <button className="btn btn-link mr-3" style={{fontSize: '0.9rem'}}>
                                                👍 Like
                                            </button>
                                            <button className="btn btn-link mr-3" style={{fontSize: '0.9rem'}}>
                                                💬 Comment
                                            </button>
                                            <button className="btn btn-link" style={{fontSize: '0.9rem'}}>
                                                📤 Share
                                            </button>
                                        </div>
                                        <button className="btn btn-link" style={{fontSize: '0.9rem'}}>
                                            📌 Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                    </div>
                </div>
            </div>
            
            {/* Mobile responsive adjustments */}
            <style>{`
                @media (max-width: 767.98px) {
                    .video-feed-container {
                        margin-left: 0 !important;
                        margin-bottom: 80px;
                        padding: 0.75rem !important;
                    }
                    
                    .video-feed-container video {
                        max-height: 300px !important;
                    }
                }
                
                @media (min-width: 768px) and (max-width: 991.98px) {
                    .video-feed-container {
                        margin-left: 200px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default VideoFeed;