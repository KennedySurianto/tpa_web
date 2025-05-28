import React from "react";

const Sidebar: React.FC = () => {
    return (
        <div className="position-fixed d-flex flex-column h-100 d-md-flex d-xs-none" 
             style={{
                 width: '250px', 
                 top: 0, 
                 left: 0, 
                 backgroundColor: '#1a1a1a', 
                 borderRight: '1px solid #333',
                 zIndex: 1000
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
            <nav className="d-flex flex-column px-3">
                <a href="/home" 
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
                   }}>
                    For You
                </a>
                
                <a href="/upload" 
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
                   }}>
                    Upload
                </a>
                
                <a href="/profile" 
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
                   }}>
                    Profile
                </a>
                
                <a href="/settings" 
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
                   }}>
                    More
                </a>
            </nav>
            
            {/* Mobile Bottom Navigation */}
            {/* <div className="d-md-none position-fixed d-flex justify-between align-center w-100 p-3"
                 style={{
                    bottom: 0,
                    left: 0,
                    backgroundColor: '#1a1a1a',
                    borderTop: '1px solid #333',
                    zIndex: 1000
                 }}>
                <a href="/home" className="flex-grow-1 text-center p-2" style={{color: '#ccc', textDecoration: 'none', fontSize: '0.8rem'}}>For You</a>
                <a href="/upload" className="flex-grow-1 text-center p-2" style={{color: '#ccc', textDecoration: 'none', fontSize: '0.8rem'}}>Upload</a>
                <a href="/profile" className="flex-grow-1 text-center p-2" style={{color: '#ccc', textDecoration: 'none', fontSize: '0.8rem'}}>Profile</a>
                <a href="/settings" className="flex-grow-1 text-center p-2" style={{color: '#ccc', textDecoration: 'none', fontSize: '0.8rem'}}>More</a>
            </div> */}
        </div>
    );
};

export default Sidebar;