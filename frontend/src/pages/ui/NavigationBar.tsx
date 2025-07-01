import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Menu,
  X,
  Search,
  Home,
  Compass,
  Upload,
  Bell,
  User,
  Users,
  MessageCircle,
  Radio,
  LogIn,
  UserPlus,
  MoreHorizontal,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Lock,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useAuth } from "../../utils/AuthProvider"
import type { FollowList, UserRequest } from "../../api/gen/follow"
import { followClient } from "../../api/grpc/followClient"
import type { User as UserType } from "../../api/gen/user"
import { avatarBytesToUrl } from "../../utils/avatarConverter"
import defaultAvatar from "../../assets/default.jpg"
import debounce from "../../utils/debounce"

const NavigationBar: React.FC = () => {
  const { user, isAuthenticated, logout, getAuthMetadata } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [theme, setTheme] = useState<"auto" | "dark" | "light">("auto")
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [followings, setFollowings] = useState<UserType[]>([])
  const [showAllFollowings, setShowAllFollowings] = useState(false)
  const [followingsLoading, setFollowingsLoading] = useState(false)

  const sidebarContentRef = useRef<HTMLDivElement>(null)

  // Create debounced search function with useCallback to prevent recreation
  const debouncedSearch = useCallback(
    debounce((q: string) => {
      if (q.trim()) {
        navigate(`/search?q=${encodeURIComponent(q.trim())}`)
      }
    }, 500),
    [navigate],
  )

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearch(value)
      if (value.trim()) {
        debouncedSearch(value)
      }
    },
    [debouncedSearch],
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch followings when user is authenticated
  useEffect(() => {
    const fetchFollowings = async () => {
      if (!isAuthenticated || !user?.id) {
        setFollowings([])
        return
      }

      setFollowingsLoading(true)
      try {
        const req: UserRequest = {
          userId: Number(user.id),
        }
        const res: FollowList = await followClient.GetFollowing(req, getAuthMetadata())
        if (res && res.follows) {
          if (Array.isArray(res.follows) && res.follows.length > 0 && res.follows[0].user) {
            setFollowings(res.follows.map((f) => f.user).filter((u): u is UserType => !!u))
          }
        }
      } catch (error) {
        console.error("Failed to fetch followings:", error)
      } finally {
        setFollowingsLoading(false)
      }
    }

    fetchFollowings()
  }, [isAuthenticated, user?.id, getAuthMetadata])

  // Memoize navigation items to prevent recreation on every render
  const navigationItems = useMemo(() => {
    const publicNavItems = [
      { path: "/home", label: "For You", icon: Home },
      { path: "/explore", label: "Explore", icon: Compass },
    ]

    const authenticatedNavItems = [
      { path: "/upload", label: "Upload", icon: Upload },
      { path: "/activity", label: "Activity", icon: Bell },
      { path: `/${user?.username}`, label: "Profile", icon: User },
      { path: "/following", label: "Following", icon: Users },
      { path: "/friends", label: "Friends", icon: Users },
      { path: "/messages", label: "Messages", icon: MessageCircle },
      { path: "/live", label: "Live", icon: Radio },
    ]

    const guestNavItems = [
      { path: "/login", label: "Login", icon: LogIn },
      { path: "/register", label: "Sign Up", icon: UserPlus },
    ]

    return {
      publicNavItems,
      authenticatedNavItems,
      guestNavItems,
      baseNavItems: isAuthenticated
        ? [...publicNavItems, ...authenticatedNavItems]
        : [...publicNavItems, ...guestNavItems],
    }
  }, [isAuthenticated, user?.username])

  const handleThemeChange = useCallback((newTheme: "auto" | "dark" | "light") => {
    setTheme(newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)
    scrollToBottom();
  }, [])

  const handleProtectedNavigation = useCallback(
    (path: string, e: React.MouseEvent) => {
      if (!isAuthenticated && navigationItems.authenticatedNavItems.some((item) => item.path === path)) {
        e.preventDefault()
        alert("Please log in to access this feature")
      }
    },
    [isAuthenticated, navigationItems.authenticatedNavItems],
  )

  const getThemeIcon = useCallback((themeMode: string) => {
    switch (themeMode) {
      case "light":
        return Sun
      case "dark":
        return Moon
      default:
        return Monitor
    }
  }, [])

  const scrollToBottom = () => {
    // Scroll to bottom when opening the dropdown
    if (sidebarContentRef.current) {
      setTimeout(() => {
        sidebarContentRef.current?.scrollTo({
          top: sidebarContentRef.current.scrollHeight,
          behavior: "auto",
        })
      }, 0)
    }
  }

  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setShowMoreDropdown(!showMoreDropdown)
      scrollToBottom();
    },
    [showMoreDropdown],
  )

  const handleViewMoreFollowings = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setShowAllFollowings(!showAllFollowings)
      scrollToBottom();
  }, [showAllFollowings])

  const displayedFollowings = showAllFollowings ? followings : followings.slice(0, 5)
  const hasMoreFollowings = followings.length > 5

  const SidebarContent = React.memo(() => (
    <div className="sidebar-content" ref={sidebarContentRef}>
      {/* Logo */}
      <div className="logo-section">
        <h2 className="logo-text">SurVace</h2>
      </div>

      {/* Authentication Status */}
      <div className="auth-status">
        <div className={`status-indicator ${isAuthenticated ? "authenticated" : "guest"}`}>
          {isAuthenticated ? (
            <>
              <Check size={14} />
              <span>Logged in as {user?.username || user?.email}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} />
              <span>Sign in to access all features</span>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            autoFocus
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Combined Navigation and Following List */}
      <div className="nav-section">
        <nav className="nav-list">
          {/* Main Navigation Items */}
          {navigationItems.baseNavItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            const isProtected = navigationItems.authenticatedNavItems.some((item) => item.path === path)
            const isDisabled = !isAuthenticated && isProtected

            return (
              <Link
                key={path}
                to={path}
                className={`nav-item ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                onClick={(e) => handleProtectedNavigation(path, e)}
                >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{label}</span>
                {isProtected && !isAuthenticated && <Lock size={12} className="lock-icon" />}
              </Link>
            )
          })}

          {/* More Button */}
          <div className={`nav-item more-button ${showMoreDropdown ? "active" : ""}`} onClick={handleMoreClick}>
            <MoreHorizontal size={20} className="nav-icon" />
            <span className="nav-label">More</span>
          </div>

          {/* More Dropdown */}
          {showMoreDropdown && (
            <div className="more-dropdown">
              {/* Theme Section */}
              <div className="dropdown-section">
                <div className="dropdown-title">Theme</div>
                <div className="theme-options">
                  {["auto", "light", "dark"].map((mode) => {
                    const ThemeIcon = getThemeIcon(mode)
                    return (
                      <div
                        key={mode}
                        className={`theme-option ${theme === mode ? "active" : ""}`}
                        onClick={() => handleThemeChange(mode as "auto" | "dark" | "light")}
                      >
                        <ThemeIcon size={16} />
                        <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Authenticated Options */}
              {isAuthenticated && (
                <div className="dropdown-section">
                  <Link to="/settings" className="dropdown-item">
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-item logout" onClick={logout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Following List Section */}
          {isAuthenticated && (
            <div className="followings-section">
              <div className="followings-header">
                <Users size={16} className="followings-icon" />
                <span className="followings-title">Following ({followings.length})</span>
              </div>
              <div className="followings-list">
                {followingsLoading ? (
                  <div className="followings-loading">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="following-skeleton">
                        <div className="skeleton-avatar"></div>
                        <div className="skeleton-name"></div>
                      </div>
                    ))}
                  </div>
                ) : followings.length === 0 ? (
                  <div className="no-followings">
                    <Users size={20} className="no-followings-icon" />
                    <span>No followings yet</span>
                  </div>
                ) : (
                  <>
                    {displayedFollowings.map((following) => (
                      <Link
                        key={following.id}
                        to={`/${following.username}`}
                        className="following-item"
                        onClick={() => setIsDrawerOpen(false)}
                      >
                        <div className="following-avatar">
                          <img
                            src={following.avatar ? avatarBytesToUrl(following.avatar) || defaultAvatar : defaultAvatar}
                            alt={following.username}
                            className="avatar-image"
                          />
                        </div>
                        <div className="following-info">
                          <span className="following-name">{following.displayName || following.username}</span>
                          <span className="following-username">@{following.username}</span>
                        </div>
                      </Link>
                    ))}
                    {hasMoreFollowings && (
                      <button className="view-more-followings" onClick={handleViewMoreFollowings}>
                        {showAllFollowings ? (
                          <>
                            <ChevronUp size={16} />
                            View Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            View More ({followings.length - 5} more)
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  ))

  return (
    <>
      {isMobile ? (
        <>
          {/* Mobile Hamburger Button */}
          <button className="mobile-menu-button" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
            <Menu size={20} />
          </button>

          {/* Mobile Drawer Overlay */}
          {isDrawerOpen && (
            <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
              <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>
                  <X size={20} />
                </button>
                <SidebarContent />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="desktop-sidebar">
          <SidebarContent />
        </div>
      )}

      <style>{`
        .desktop-sidebar {
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .sidebar-content {
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0;
          scroll-behavior: auto;
        }

        .sidebar-content::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .sidebar-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .logo-section {
          text-align: center;
          padding: 0 1.5rem 2rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1.5rem;
          flex-shrink: 0;
        }

        .logo-text {
          margin: 0;
          color: #ffffff;
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-status {
          padding: 0 1.5rem;
          margin-bottom: 1.5rem;
          flex-shrink: 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
          border: 1px solid;
        }

        .status-indicator.authenticated {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .status-indicator.guest {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .search-section {
          padding: 0 1.5rem;
          margin-bottom: 1.5rem;
          flex-shrink: 0;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .nav-section {
          flex: 1;
          padding: 0 1.5rem;
          min-height: 0;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          color: #d1d5db;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .nav-item:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          transform: translateX(2px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
          color: #ffffff;
          border: 1px solid rgba(139, 92, 246, 0.3);
          font-weight: 600;
        }

        .nav-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          color: #6b7280;
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
        }

        .lock-icon {
          color: #ef4444;
          flex-shrink: 0;
        }

        .followings-section {
          margin: 1.5rem 0;
          padding: 1rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .followings-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1rem;
          padding: 0 1rem;
        }

        .followings-icon {
          color: #8b5cf6;
        }

        .followings-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
        }

        .followings-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .followings-loading {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0 1rem;
        }

        .following-skeleton {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.5rem;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .skeleton-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .skeleton-name {
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          flex: 1;
        }

        .no-followings {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 1rem;
          color: #8b949e;
          font-size: 0.8rem;
          text-align: center;
          justify-content: center;
        }

        .no-followings-icon {
          color: #8b949e;
        }

        .following-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .following-item:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(2px);
        }

        .following-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .following-info {
          flex: 1;
          min-width: 0;
        }

        .following-name {
          display: block;
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .following-username {
          display: block;
          color: #8b949e;
          font-size: 0.7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .view-more-followings {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0.5rem 1rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          color: #8b5cf6;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .view-more-followings:hover {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .more-button {
          margin-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1rem;
        }

        .more-dropdown {
          margin-top: 0.5rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          position: relative;
        }

        .dropdown-section {
          margin-bottom: 1rem;
        }

        .dropdown-section:last-child {
          margin-bottom: 0;
        }

        .dropdown-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #9ca3af;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .theme-options {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.85rem;
          color: #d1d5db;
        }

        .theme-option:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .theme-option.active {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.85rem;
          color: #d1d5db;
          text-decoration: none;
          margin-bottom: 0.25rem;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .dropdown-item.logout {
          color: #ef4444;
        }

        .dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        /* Mobile Styles */
        .mobile-menu-button {
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1000;
          background: rgba(26, 26, 26, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mobile-menu-button:hover {
          background: rgba(26, 26, 26, 1);
          transform: scale(1.05);
        }

        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        }

        .drawer-content {
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .drawer-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s ease;
        }

        .drawer-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none;
          }
        }

        @media (min-width: 769px) {
          .mobile-menu-button {
            display: none;
          }
        }
      `}</style>
    </>
  )
}

export default NavigationBar
