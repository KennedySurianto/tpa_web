import React from "react";
import { useFollowingVideos } from "../../hooks/useFollowingVideos";
import VideoScroll from "../../components/VideoScroll";

const FollowingPage: React.FC = () => {
  const { videos, setVideos, loading } = useFollowingVideos();

  return (
    <>
      <VideoScroll videos={videos} setVideos={setVideos} loading={loading} />
    </>
  );
};

export default FollowingPage;
