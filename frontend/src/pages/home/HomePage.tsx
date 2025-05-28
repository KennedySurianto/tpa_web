import React from "react";
import Sidebar from "./components/Sidebar";
import VideoFeed from "./components/VideoFeed";

const HomePage: React.FC = () => {
    return (
        <div className="position-relative"
            style={{
                minHeight: '100vh',
                backgroundColor: '#f8f9fa',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
                overflowX: 'hidden'
            }}>
            
            {/* Background overlay for consistent styling */}
            <div className="position-fixed w-100 h-100"
                style={{
                    top: 0,
                    left: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: -1
                }}>
            </div>
            
            {/* Main layout container */}
            <div className="d-flex position-relative">
                
                {/* Sidebar Component */}
                <Sidebar />
                
                {/* Main content area with VideoFeed */}
                <div className="flex-grow-1 position-relative"
                    style={{
                        transition: 'all 0.3s ease'
                    }}>
                    
                    <VideoFeed />
                    
                </div>
                
            </div>
            
            {/* Responsive adjustments */}
            <style>{`
                @media (max-width: 767.98px) {
                    .homepage-main-content {
                        margin-left: 0 !important;
                        padding-bottom: 80px;
                    }
                }
                
                @media (min-width: 768px) and (max-width: 991.98px) {
                    .homepage-main-content {
                        margin-left: 200px !important;
                    }
                }
                
                /* Loading state */
                .homepage-container.loading {
                    opacity: 0.7;
                }
                
                .homepage-container.loading::after {
                    content: '';
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    width: 40px;
                    height: 40px;
                    margin: -20px 0 0 -20px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #007BFF;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    z-index: 1001;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            
        </div>
    );
};

export default HomePage;