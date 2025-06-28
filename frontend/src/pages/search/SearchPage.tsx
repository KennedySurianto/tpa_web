import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Tabs, Tab } from "@mui/material";
import debounce from "lodash.debounce";
import jaroWinkler from "jaro-winkler";
import { useLocation } from "react-router-dom";
import type { User, UserListResponse } from "../../api/gen/user";
import { userClient } from "../../api/grpc/userClient";
import type { GetVideosResponse, Video } from "../../api/gen/video";
import { videoClient } from "../../api/grpc/videoClient";
import { UserCard } from "../../components/UserCard";
import { VideoCard } from "../../components/VideoCard";
import { VideoDetailModal } from "../modals/VideoDetailModal";

const SearchPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [tab, setTab] = useState("top");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [dataFetched, setDataFetched] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get("q") || "";

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
      debounce((query: string, currentPage: number, users: User[], videos: Video[]) => {
        setLoading(true);
        const matchedUsers = users.filter(
          (u) => jaroWinkler(u.username?.toLowerCase() ?? "", query.toLowerCase()) > 0.7
        );
        const matchedVideos = videos.filter(
          (v) => jaroWinkler(v.caption.toLowerCase(), query.toLowerCase()) > 0.7
        );

        setFilteredUsers(matchedUsers.slice(0, currentPage * 5));
        setFilteredVideos(matchedVideos.slice(0, currentPage * 5));
        setLoading(false);
      }, 300),
    []
  );

  useEffect(() => {
    if (searchQuery.trim() && allUsers.length > 0) {
      debouncedSearch(searchQuery, page, allUsers, allVideos);
    } else {
      setFilteredUsers([]);
      setFilteredVideos([]);
    }
  }, [searchQuery, page, allUsers, allVideos]);

  const handleTabChange = (_: any, newValue: string) => setTab(newValue);

  const onScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const isBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 10;

    if (isBottom) {
      setPage((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    const current = scrollRef.current;
    if (current) current.addEventListener("scroll", onScroll);
    return () => current?.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const renderUserCard = (user: User) => (
    <UserCard key={user.id} user={user} currentUserId={Number(user?.id)} />
  );

  const renderVideoCard = (video: Video) => (
    <VideoCard
      key={video.id}
      video={video}
      onClick={() => {
        setSelectedVideo(video);
        setModalOpen(true);
      }}
    />
  );

  return (
    <div className="search-page">
      <div className="scroll-container" ref={scrollRef}>
        <h2 style={{ color: "#ccc" }}>Search Results for: "{searchQuery}"</h2>

        {errorMessage && (
          <div style={{ color: "#ff6b6b", marginTop: "12px" }}>
            {errorMessage}
          </div>
        )}

        <Tabs
          value={tab}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: { backgroundColor: "white" } }}
          sx={{
            color: "white",
            "& .MuiTab-root": { color: "white" },
            "& .Mui-selected": { color: "white", fontWeight: "bold" },
          }}
        >
          <Tab label="Top" value="top" />
          <Tab label="Users" value="users" />
          <Tab label="Videos" value="videos" />
        </Tabs>

        {loading && <div className="skeleton">Loading...</div>}
        {!loading && !dataFetched && <div className="skeleton">Fetching users...</div>}
        {!loading && dataFetched && filteredUsers.length === 0 && filteredVideos.length === 0 && (
          <div style={{ color: "#aaa", marginTop: "16px" }}>
            No results for "{searchQuery}"
          </div>
        )}

        {tab === "top" && (
          <>
            {filteredUsers.length > 0 && (
              <div className="results">{filteredUsers.slice(0, 5).map(renderUserCard)}</div>
            )}
            {filteredVideos.length > 0 && (
              <div className="results-videos">{filteredVideos.slice(0, 5).map(renderVideoCard)}</div>
            )}
          </>
        )}
        {tab === "users" && <div className="results">{filteredUsers.map(renderUserCard)}</div>}
        {tab === "videos" && <div className="results-videos">{filteredVideos.map(renderVideoCard)}</div>}
      </div>

      <VideoDetailModal
        video={selectedVideo}
        isOpen={modalOpen}
        onClose={() => {
          setSelectedVideo(null);
          setModalOpen(false);
        }}
      />

      <style>{`
        .search-page {
          height: 100vh;
          background-color: #121212;
          color: white;
          display: flex;
          flex-direction: column;
        }

        .scroll-container {
          overflow-y: auto;
          flex: 1;
          padding: 20px;
        }

        .results-videos {
          display: flex;
          flex-direction: row;
          gap: 12px;
          margin-top: 16px;
        }

        .results {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .user-card, .video-card {
          background: #1f1f1f;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }

        .user-card img, .video-card img {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 6px;
        }

        .skeleton {
          background: #333;
          height: 50px;
          border-radius: 8px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.6 }
          50% { opacity: 1 }
          100% { opacity: 0.6 }
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
