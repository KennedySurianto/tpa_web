import React from "react";
import { useParams } from "react-router-dom"; // Import useParams to get route parameters
import { useSpecificVideo } from "../../hooks/useSpecificVideo"; // Import the new hook
import VideoScroll from "../../components/VideoScroll";

const VideoPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();

  if (!videoId) {
    return <div>Invalid video ID</div>;
  }

  const { videos, setVideos, loading } = useSpecificVideo(videoId);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!videos || videos.length === 0) {
    return <div>Video not found</div>;
  }

  return (
    <>
      <VideoScroll videos={videos} setVideos={setVideos} loading={loading} />
    </>
  );
};

export default VideoPage;
