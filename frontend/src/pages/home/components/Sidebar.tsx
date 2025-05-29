import React from "react";
import { Link } from "react-router-dom";

const Sidebar: React.FC = () => {
    return (
        <div className="d-flex flex-column sidebar-container" 
             style={{
                 width: '250px',
                 minHeight: '100vh',
                 backgroundColor: '#1a1a1a', 
                 borderRight: '1px solid #333',
                 flexShrink: 0 // Prevent sidebar from shrinking
             }}>
            
            {/* Logo */}
            <div className="text-center py-4">
                <h2 className="m-0" style={{color: 'white', fontSize: '1.5rem', fontWeight: 'bold'}}>
                    SurVace
                </h2>
            </div>
            
            {/* Search */}
            <div className="px-3 mb-4">
                <input
                    type="text"
                    className="w-100 p-2"
                    placeholder="Search..."
                    style={{
                        border: '1px solid #333',
                        borderRadius: '8px',
                        backgroundColor: '#2a2a2a',
                        color: 'white'
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            // handle search redirect
                        }
                    }}
                />
            </div>
            
            {/* Navigation Links */}
            <nav className="d-flex flex-column px-3 flex-grow-1">
                <Link 
                    to="/home" 
                    className="text-left p-3 mb-2" 
                    style={{
                        color: '#ccc', 
                        textDecoration: 'none', 
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#333';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#ccc';
                    }}
                >
                    For You
                </Link>
                
                <Link 
                    to="/upload" 
                    className="text-left p-3 mb-2" 
                    style={{
                        color: '#ccc', 
                        textDecoration: 'none', 
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#333';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#ccc';
                    }}
                >
                    Upload
                </Link>
                
                <Link 
                    to="/profile" 
                    className="text-left p-3 mb-2" 
                    style={{
                        color: '#ccc', 
                        textDecoration: 'none', 
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#333';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#ccc';
                    }}
                >
                    Profile
                </Link>
                
                <Link 
                    to="/settings" 
                    className="text-left p-3 mb-2" 
                    style={{
                        color: '#ccc', 
                        textDecoration: 'none', 
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#333';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#ccc';
                    }}
                >
                    More
                </Link>
            </nav>
            
        </div>
    );
};

export default Sidebar;