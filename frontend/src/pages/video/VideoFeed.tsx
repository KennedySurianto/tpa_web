import React from "react";
import VideoScroll from "../../components/VideoScroll";
import { useVideos } from "../../hooks/useVideos";

const VideoFeed: React.FC = () => {
  const { videos, setVideos, loading } = useVideos();
  return (
    <>
      <VideoScroll videos={videos} setVideos={setVideos} loading={loading} />
    </>
  );
};

export default VideoFeed;
