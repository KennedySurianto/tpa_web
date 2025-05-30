import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { path: "/home", label: "For You" },
        { path: "/upload", label: "Upload" },
        { path: "/profile", label: "Profile" },
        { path: "/settings", label: "More" },
    ];

    return (
        <div
            className="d-flex flex-column sidebar-container"
            style={{
                width: "250px",
                minHeight: "100vh",
                backgroundColor: "#1a1a1a",
                borderRight: "1px solid #333",
                flexShrink: 0,
            }}
        >
            {/* Logo */}
            <div className="text-center py-4">
                <h2
                    className="m-0"
                    style={{ color: "white", fontSize: "1.5rem", fontWeight: "bold" }}
                >
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
                        border: "1px solid #333",
                        borderRadius: "8px",
                        backgroundColor: "#2a2a2a",
                        color: "white",
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
                {navItems.map(({ path, label }) => {
                    const isActive = location.pathname === path;
                    console.log("Current path:", location.pathname, "Checking against:", path);
                    console.log("Is active:", isActive);

                    return (
                        <Link
                            key={path}
                            to={path}
                            className="text-left p-3 mb-2"
                            style={{
                                color: isActive ? "white" : "#ccc",
                                backgroundColor: isActive ? "#333" : "transparent",
                                textDecoration: "none",
                                borderRadius: "8px",
                                transition: "all 0.2s ease",
                                fontWeight: isActive ? "bold" : "normal",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#333";
                                e.currentTarget.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#ccc";
                                }
                            }}
                        >
                            {label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
