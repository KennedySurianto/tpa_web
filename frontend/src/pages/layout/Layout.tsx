import React from "react";
import NavigationBar from "../ui/NavigationBar";
import { Outlet } from "react-router-dom";

const Layout: React.FC = () => {
    return (
        <div className="d-flex"
            style={{
                minHeight: '100vh',
                backgroundColor: '#f8f9fa',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
                overflow: 'hidden'
            }}>
            
            {/* Sidebar Component - Takes up its own space */}
            <NavigationBar />
            
            {/* Main content area - Fills remaining space */}
            <div className="flex-grow-1 d-flex flex-column"
                style={{
                    minHeight: '100vh',
                    overflow: 'auto'
                }}>
                
                <Outlet />
                
            </div>
            
            {/* Responsive adjustments */}
            <style>{`
                @media (max-width: 767.98px) {
                    .layout-container {
                        flex-direction: column !important;
                    }
                    
                    .sidebar-container {
                        width: 100% !important;
                        height: auto !important;
                        position: relative !important;
                    }
                    
                    .main-content-area {
                        flex-grow: 1 !important;
                    }
                }
                
                @media (min-width: 768px) {
                    .layout-container {
                        flex-direction: row !important;
                    }
                }
            `}</style>
            
        </div>
    );
};

export default Layout;