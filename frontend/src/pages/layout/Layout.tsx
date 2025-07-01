import type React from "react"
import NavigationBar from "../ui/NavigationBar"
import { Outlet } from "react-router-dom"

const Layout: React.FC = () => {
  return (
    <div className="layout-container">
      {/* Sidebar Component - Takes up its own space */}
      <NavigationBar />

      {/* Main content area - Fills remaining space */}
      <div className="main-content-area">
        <Outlet />
      </div>

      <style>{`
                .layout-container {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f8f9fa;
                    overflow: hidden;
                }
                
                .main-content-area {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    overflow: auto;
                }
                
                /* Responsive adjustments */
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
  )
}

export default Layout
