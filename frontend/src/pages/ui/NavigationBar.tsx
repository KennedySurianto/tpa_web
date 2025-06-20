import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";

const NavigationBar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const [search, setSearch] = useState("");
    const [theme, setTheme] = useState<"auto" | "dark" | "light">("auto");
    const [showMoreDropdown, setShowMoreDropdown] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Public navigation items - available to all users
    const publicNavItems = [
        { path: "/home", label: "For You" },
        { path: "/explore", label: "Explore" },
    ];

    // Authentication required items - only shown when logged in
    const authenticatedNavItems = [
        { path: "/upload", label: "Upload" },
        { path: "/activity", label: "Activity" },
        { path: `/${user?.username}`, label: "Profile" },
        { path: "/following", label: "Following" },
        { path: "/friends", label: "Friends" },
        { path: "/messages", label: "Messages" },
        { path: "/live", label: "Live" },
    ];

    // Guest items - only shown when not logged in
    const guestNavItems = [
        { path: "/login", label: "Login" },
        { path: "/register", label: "Sign Up" },
    ];

    // Determine navigation items based on authentication status
    const baseNavItems = isAuthenticated 
        ? [...publicNavItems, ...authenticatedNavItems]
        : [...publicNavItems, ...guestNavItems];

    const filteredNavItems = baseNavItems.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleThemeChange = (newTheme: "auto" | "dark" | "light") => {
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    };

    const handleProtectedNavigation = (path: string, e: React.MouseEvent) => {
        // If user is not authenticated and trying to access protected routes
        if (!isAuthenticated && authenticatedNavItems.some(item => item.path === path)) {
            e.preventDefault();
            // You could show a login modal or redirect to login page
            alert("Please log in to access this feature");
            // Or redirect to login: navigate('/login');
        }
    };

    return (
        <>
            {isMobile ? (
                <>
                    {/* Hamburger Button */}
                    <div
                        style={{
                            position: "fixed",
                            top: 10,
                            left: 10,
                            zIndex: 1000,
                            backgroundColor: "#1a1a1a",
                            color: "white",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    >
                        ☰
                    </div>

                    {/* Drawer Panel */}
                    {isDrawerOpen && (
                        <div
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                height: "100vh",
                                width: "250px",
                                backgroundColor: "#1a1a1a",
                                borderRight: "1px solid #333",
                                zIndex: 999,
                                overflowY: "auto",
                            }}
                        >
                            {/* Close button */}
                            <div
                                style={{
                                    textAlign: "right",
                                    padding: "10px",
                                    color: "white",
                                    cursor: "pointer",
                                }}
                                onClick={() => setIsDrawerOpen(false)}
                            >
                                ✖
                            </div>

                            <div
                            className="d-flex flex-column sidebar-container"
                                style={{
                                    width: "250px",
                                    height: "100vh",
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

                                {/* Authentication Status Indicator */}
                                <div className="px-3 mb-2">
                                    <div 
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            backgroundColor: isAuthenticated ? "#1a4d3a" : "#4d1a1a",
                                            border: `1px solid ${isAuthenticated ? "#22c55e" : "#ef4444"}`,
                                            fontSize: "12px",
                                            color: isAuthenticated ? "#22c55e" : "#ef4444",
                                            textAlign: "center"
                                        }}
                                        >
                                        {isAuthenticated ? (
                                            <>✓ Logged in as {user?.username || user?.email}</>
                                        ) : (
                                            <>⚠ Sign in to access all features</>
                                        )}
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="px-3 mb-4">
                                    <input
                                        type="text"
                                        className="w-100 p-2"
                                        placeholder="Search..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{
                                            border: "1px solid #333",
                                            borderRadius: "8px",
                                            backgroundColor: "#2a2a2a",
                                            color: "white",
                                        }}
                                    />
                                </div>

                                {/* Scrollable Navigation Links */}
                                <div className="flex-grow-1 px-3" style={{ overflowY: "auto" }}>
                                    <nav className="d-flex flex-column">
                                        {filteredNavItems.map(({ path, label }) => {
                                            const isActive = location.pathname === path;
                                            const isProtected = authenticatedNavItems.some(item => item.path === path);
                                            const isDisabled = !isAuthenticated && isProtected;
                                            
                                            return (
                                                <Link
                                                    key={path}
                                                    to={path}
                                                    className="text-left p-3 mb-2"
                                                    onClick={(e) => handleProtectedNavigation(path, e)}
                                                    style={{
                                                        color: isActive ? "white" : (isDisabled ? "#666" : "#ccc"),
                                                        backgroundColor: isActive ? "#333" : "transparent",
                                                        textDecoration: "none",
                                                        borderRadius: "8px",
                                                        transition: "all 0.2s ease",
                                                        fontWeight: isActive ? "bold" : "normal",
                                                        opacity: isDisabled ? 0.5 : 1,
                                                        cursor: isDisabled ? "not-allowed" : "pointer",
                                                        position: "relative",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isDisabled) {
                                                            e.currentTarget.style.backgroundColor = "#333";
                                                            e.currentTarget.style.color = "white";
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isActive && !isDisabled) {
                                                            e.currentTarget.style.backgroundColor = "transparent";
                                                            e.currentTarget.style.color = "#ccc";
                                                        }
                                                    }}
                                                >
                                                    {label}
                                                    {isProtected && !isAuthenticated && (
                                                        <span style={{ 
                                                            fontSize: "10px", 
                                                            marginLeft: "8px",
                                                            color: "#ef4444"
                                                        }}>
                                                            🔒
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}

                                        {/* More Button */}
                                        <div
                                            className="text-left p-3 mb-2"
                                            onClick={() => setShowMoreDropdown((prev) => !prev)}
                                            style={{
                                                color: "#ccc",
                                                backgroundColor: showMoreDropdown ? "#333" : "transparent",
                                                textDecoration: "none",
                                                borderRadius: "8px",
                                                transition: "all 0.2s ease",
                                                cursor: "pointer",
                                                fontWeight: "normal",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#333";
                                                e.currentTarget.style.color = "white";
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!showMoreDropdown) {
                                                    e.currentTarget.style.backgroundColor = "transparent";
                                                    e.currentTarget.style.color = "#ccc";
                                                }
                                            }}
                                        >
                                            More
                                        </div>

                                        {/* Dropdown Content */}
                                        {showMoreDropdown && (
                                            <div style={{ paddingLeft: "1rem", color: "#ccc" }}>
                                                {/* Theme toggle */}
                                                <div className="mb-2">Theme:</div>
                                                {["auto", "light", "dark"].map((mode) => (
                                                    <div
                                                    key={mode}
                                                    onClick={() => handleThemeChange(mode as "auto" | "dark" | "light")}
                                                        style={{
                                                            padding: "6px 12px",
                                                            cursor: "pointer",
                                                            backgroundColor: theme === mode ? "#444" : "transparent",
                                                            borderRadius: "6px",
                                                            color: theme === mode ? "#fff" : "#ccc",
                                                        }}
                                                    >
                                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                    </div>
                                                ))}

                                                {/* Conditional content based on authentication */}
                                                {isAuthenticated && (
                                                    // Authenticated user options
                                                    <>
                                                        <Link
                                                            to="/settings"
                                                            className="d-block mt-3"
                                                            style={{ color: "#ccc", textDecoration: "none" }}
                                                            >
                                                            Settings
                                                        </Link>
                                                        <div
                                                            onClick={logout}
                                                            className="mt-2"
                                                            style={{
                                                                color: "#f55",
                                                                cursor: "pointer",
                                                                padding: "6px 0",
                                                            }}
                                                            >
                                                            Logout
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </nav>

                                    {filteredNavItems.length === 0 && (
                                        <div style={{ color: "#888", padding: "1rem", textAlign: "center" }}>
                                            No results found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div
                className="d-flex flex-column sidebar-container"
                    style={{
                        width: "250px",
                        height: "100vh",
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

                    {/* Authentication Status Indicator */}
                    <div className="px-3 mb-2">
                        <div 
                            style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                backgroundColor: isAuthenticated ? "#1a4d3a" : "#4d1a1a",
                                border: `1px solid ${isAuthenticated ? "#22c55e" : "#ef4444"}`,
                                fontSize: "12px",
                                color: isAuthenticated ? "#22c55e" : "#ef4444",
                                textAlign: "center"
                            }}
                            >
                            {isAuthenticated ? (
                                <>✓ Logged in as {user?.username || user?.email}</>
                            ) : (
                                <>⚠ Sign in to access all features</>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-3 mb-4">
                        <input
                            type="text"
                            className="w-100 p-2"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                border: "1px solid #333",
                                borderRadius: "8px",
                                backgroundColor: "#2a2a2a",
                                color: "white",
                            }}
                        />
                    </div>

                    {/* Scrollable Navigation Links */}
                    <div className="flex-grow-1 px-3" style={{ overflowY: "auto" }}>
                        <nav className="d-flex flex-column">
                            {filteredNavItems.map(({ path, label }) => {
                                const isActive = location.pathname === path;
                                const isProtected = authenticatedNavItems.some(item => item.path === path);
                                const isDisabled = !isAuthenticated && isProtected;
                                
                                return (
                                    <Link
                                        key={path}
                                        to={path}
                                        className="text-left p-3 mb-2"
                                        onClick={(e) => handleProtectedNavigation(path, e)}
                                        style={{
                                            color: isActive ? "white" : (isDisabled ? "#666" : "#ccc"),
                                            backgroundColor: isActive ? "#333" : "transparent",
                                            textDecoration: "none",
                                            borderRadius: "8px",
                                            transition: "all 0.2s ease",
                                            fontWeight: isActive ? "bold" : "normal",
                                            opacity: isDisabled ? 0.5 : 1,
                                            cursor: isDisabled ? "not-allowed" : "pointer",
                                            position: "relative",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isDisabled) {
                                                e.currentTarget.style.backgroundColor = "#333";
                                                e.currentTarget.style.color = "white";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive && !isDisabled) {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                                e.currentTarget.style.color = "#ccc";
                                            }
                                        }}
                                    >
                                        {label}
                                        {isProtected && !isAuthenticated && (
                                            <span style={{ 
                                                fontSize: "10px", 
                                                marginLeft: "8px",
                                                color: "#ef4444"
                                            }}>
                                                🔒
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}

                            {/* More Button */}
                            <div
                                className="text-left p-3 mb-2"
                                onClick={() => setShowMoreDropdown((prev) => !prev)}
                                style={{
                                    color: "#ccc",
                                    backgroundColor: showMoreDropdown ? "#333" : "transparent",
                                    textDecoration: "none",
                                    borderRadius: "8px",
                                    transition: "all 0.2s ease",
                                    cursor: "pointer",
                                    fontWeight: "normal",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#333";
                                    e.currentTarget.style.color = "white";
                                }}
                                onMouseLeave={(e) => {
                                    if (!showMoreDropdown) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = "#ccc";
                                    }
                                }}
                            >
                                More
                            </div>

                            {/* Dropdown Content */}
                            {showMoreDropdown && (
                                <div style={{ paddingLeft: "1rem", color: "#ccc" }}>
                                    {/* Theme toggle */}
                                    <div className="mb-2">Theme:</div>
                                    {["auto", "light", "dark"].map((mode) => (
                                        <div
                                        key={mode}
                                        onClick={() => handleThemeChange(mode as "auto" | "dark" | "light")}
                                            style={{
                                                padding: "6px 12px",
                                                cursor: "pointer",
                                                backgroundColor: theme === mode ? "#444" : "transparent",
                                                borderRadius: "6px",
                                                color: theme === mode ? "#fff" : "#ccc",
                                            }}
                                        >
                                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                        </div>
                                    ))}

                                    {/* Conditional content based on authentication */}
                                    {isAuthenticated && (
                                        // Authenticated user options
                                        <>
                                            <Link
                                                to="/settings"
                                                className="d-block mt-3"
                                                style={{ color: "#ccc", textDecoration: "none" }}
                                                >
                                                Settings
                                            </Link>
                                            <div
                                                onClick={logout}
                                                className="mt-2"
                                                style={{
                                                    color: "#f55",
                                                    cursor: "pointer",
                                                    padding: "6px 0",
                                                }}
                                                >
                                                Logout
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </nav>

                        {filteredNavItems.length === 0 && (
                            <div style={{ color: "#888", padding: "1rem", textAlign: "center" }}>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default NavigationBar;