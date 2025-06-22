import React from "react";
import { useFriendVideos } from "../../hooks/useFriendVideos";
import VideoScroll from "../../components/VideoScroll";

const FriendPage: React.FC = () => {
  const { videos, setVideos, loading } = useFriendVideos();
  
  return (
    <>
      <VideoScroll 
        videos={videos} 
        setVideos={setVideos}
        loading={loading} 
      />
    </>
  )
};

export default FriendPage;