import type React from "react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Search, Users, Video, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import type { User, UserListResponse } from "../../api/gen/user";
import { userClient } from "../../api/grpc/userClient";
import type { GetVideosResponse, Video as VideoType } from "../../api/gen/video";
import { videoClient } from "../../api/grpc/videoClient";
import { UserCard } from "../../components/UserCard";
import { VideoCard } from "../../components/VideoCard";
import jaroDistance from "../../utils/jaroDistance";
import debounce from "../../utils/debounce";

const SearchPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allVideos, setAllVideos] = useState<VideoType[]>([]);
  const [tab, setTab] = useState("top");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [dataFetched, setDataFetched] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get("q") || "";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res: UserListResponse = await userClient.GetAllUsers({});
        setAllUsers(res.users);
        setDataFetched(true);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setErrorMessage("An error occurred while fetching users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const res: GetVideosResponse = await videoClient.GetAllVideos({});
        setAllVideos(res.videos);
        setDataFetched(true);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setErrorMessage("An error occurred while fetching videos.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string, currentPage: number, users: User[], videos: VideoType[]) => {
        setLoading(true);
        const matchedUsers = users.filter(
          (u) => jaroDistance(u.username?.toLowerCase() ?? "", query.toLowerCase()) > 0.7,
        );
        const matchedVideos = videos.filter(
          (v) => jaroDistance(v.caption.toLowerCase(), query.toLowerCase()) > 0.7,
        );

        setFilteredUsers(matchedUsers.slice(0, currentPage * 5));
        setFilteredVideos(matchedVideos.slice(0, currentPage * 5));
        setLoading(false);
      }, 300),
    [],
  );

  useEffect(() => {
    if (searchQuery.trim() && allUsers.length > 0) {
      debouncedSearch(searchQuery, page, allUsers, allVideos);
    } else {
      setFilteredUsers([]);
      setFilteredVideos([]);
    }
  }, [searchQuery, page, allUsers, allVideos, debouncedSearch]);

  const handleTabChange = useCallback((newValue: string) => {
    setTab(newValue);
    setPage(1); // Reset page when changing tabs
  }, []);

  const onScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const isBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;

    if (isBottom && !loading) {
      setPage((prev) => prev + 1);
    }
  }, [loading]);

  useEffect(() => {
    const current = scrollRef.current;
    if (current) current.addEventListener("scroll", onScroll);
    return () => current?.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const renderUserCard = useCallback(
    (user: User) => <UserCard key={user.id} user={user} currentUserId={Number(user?.id)} />,
    [],
  );

  const renderVideoCard = useCallback(
    (video: VideoType) => <VideoCard key={video.id} video={video} />,
    [],
  );

  const tabs = useMemo(
    () => [
      { id: "top", label: "Top", icon: TrendingUp },
      { id: "users", label: "Users", icon: Users },
      { id: "videos", label: "Videos", icon: Video },
    ],
    [],
  );

  const hasResults = filteredUsers.length > 0 || filteredVideos.length > 0;
  const showNoResults = !loading && dataFetched && !hasResults && searchQuery.trim();

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-title">
          <h1>Search Results</h1>
        </div>
        {searchQuery && (
          <div className="search-query">
            <span className="query-label">Results for:</span>
            <span className="query-text">"{searchQuery}"</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`tab ${tab === id ? "active" : ""}`}
              onClick={() => handleTabChange(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-container" ref={scrollRef}>
        {loading && !dataFetched && (
          <div className="loading-container">
            <div className="loading-spinner">
              <Loader2 size={32} className="spinner" />
            </div>
            <p>Searching...</p>
          </div>
        )}

        {showNoResults && (
          <div className="no-results">
            <Search size={48} className="no-results-icon" />
            <h3>No results found</h3>
            <p>Try adjusting your search terms or browse different categories</p>
          </div>
        )}

        {dataFetched && hasResults && (
          <div className="results-container">
            {tab === "top" && (
              <>
                {filteredUsers.length > 0 && (
                  <div className="results-section">
                    <div className="section-header">
                      <Users size={20} />
                      <h3>Users</h3>
                      <span className="count">{filteredUsers.length}</span>
                    </div>
                    <div className="results-grid users-grid">
                      {filteredUsers.slice(0, 5).map(renderUserCard)}
                    </div>
                  </div>
                )}

                {filteredVideos.length > 0 && (
                  <div className="results-section">
                    <div className="section-header">
                      <Video size={20} />
                      <h3>Videos</h3>
                      <span className="count">{filteredVideos.length}</span>
                    </div>
                    <div className="results-grid videos-grid">
                      {filteredVideos.slice(0, 5).map(renderVideoCard)}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "users" && (
              <div className="results-section">
                <div className="section-header">
                  <Users size={20} />
                  <h3>All Users</h3>
                  <span className="count">{filteredUsers.length}</span>
                </div>
                <div className="results-grid users-grid">{filteredUsers.map(renderUserCard)}</div>
              </div>
            )}

            {tab === "videos" && (
              <div className="results-section">
                <div className="section-header">
                  <Video size={20} />
                  <h3>All Videos</h3>
                  <span className="count">{filteredVideos.length}</span>
                </div>
                <div className="results-grid videos-grid">
                  {filteredVideos.map(renderVideoCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && dataFetched && (
          <div className="loading-more">
            <Loader2 size={20} className="spinner" />
            <span>Loading more results...</span>
          </div>
        )}
      </div>

      <style>{`
        .search-page {
          height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .search-header {
          padding: 2rem 2rem 1rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
        }

        .search-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1rem;
        }

        .search-title h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .search-icon {
          color: #8b5cf6;
        }

        .search-query {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
        }

        .query-label {
          color: #8b949e;
        }

        .query-text {
          color: #ffffff;
          font-weight: 600;
          background: rgba(139, 92, 246, 0.1);
          padding: 4px 12px;
          border-radius: 8px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 1rem 2rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          margin: 1rem 2rem;
          color: #ef4444;
          font-weight: 500;
        }

        .tabs-container {
          padding: 0 2rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tabs {
          display: flex;
          gap: 4px;
          padding: 1rem 0;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: #8b949e;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .tab.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
          color: #ffffff;
          border: 1px solid rgba(139, 92, 246, 0.3);
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
        }

        .scroll-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          scroll-behavior: smooth;
        }

        .scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .scroll-container::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }

        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          margin-bottom: 1rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
          color: #8b5cf6;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-container p {
          color: #8b949e;
          font-size: 1.1rem;
          margin: 0;
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .no-results-icon {
          color: #8b949e;
          margin-bottom: 1.5rem;
        }

        .no-results h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
        }

        .no-results p {
          margin: 0;
          color: #8b949e;
          font-size: 1rem;
          max-width: 400px;
        }

        .results-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .results-section {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
          flex: 1;
        }

        .count {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .results-grid {
          display: grid;
          gap: 1rem;
        }

        .users-grid {
          grid-template-columns: 1fr;
        }

        .videos-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 2rem;
          color: #8b949e;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .search-header {
            padding: 1.5rem 1rem 1rem 1rem;
          }

          .search-title h1 {
            font-size: 1.5rem;
          }

          .tabs-container {
            padding: 0 1rem;
          }

          .tabs {
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .tabs::-webkit-scrollbar {
            display: none;
          }

          .tab {
            flex-shrink: 0;
            padding: 10px 16px;
            font-size: 0.85rem;
          }

          .scroll-container {
            padding: 1rem;
          }

          .results-section {
            padding: 1rem;
          }

          .section-header {
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
          }

          .section-header h3 {
            font-size: 1.1rem;
          }

          .videos-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
          }
        }

        @media (max-width: 480px) {
          .search-header {
            padding: 1rem;
          }

          .search-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .search-title h1 {
            font-size: 1.25rem;
          }

          .search-query {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .videos-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .loading-container,
          .no-results {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
