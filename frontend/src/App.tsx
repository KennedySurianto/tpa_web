import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import OnBoardingPage from "./pages/auth/OnBoardingPage";
import PublicRoute from "./routes/PublicRoute";
import { AuthProvider } from "./utils/AuthProvider";
import Layout from "./pages/layout/Layout";
import VideoFeed from "./pages/video/VideoFeed";
import UploadVideoPage from "./pages/video/UploadVideoPage";
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import PrivateRoute from "./routes/PrivateRoute";
import LivePage from "./pages/video/LiveStreamerPage";
import LiveViewerPage from "./pages/video/LiveViewerPage";
import FriendPage from "./pages/video/FriendPage";
import FollowingPage from "./pages/video/FollowingPage";
import PlaylistPage from "./pages/profile/PlaylistPage";
import SearchPage from "./pages/search/SearchPage";
import { NotificationProvider } from "./context/NotificationContext";
import ChatLayout from "./pages/chat/ChatLayout";
import VideoPage from "./pages/video/VideoPage";
import ManageVideosPage from "./pages/video/ManageVideosPage";
import EditVideoPage from "./pages/video/EditVideoPage";
import { GoogleOAuthProvider } from "@react-oauth/google";

const App = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error("Google Client ID is not set! Check your .env file.");
  }

  return (
    <BrowserRouter>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<OnBoardingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Always accessible */}
              <Route path="/forgot-password" element={<ResetPasswordPage />} />

              <Route element={<Layout />}>
                <Route path="/home" element={<VideoFeed />} />
                <Route path="/:username" element={<ProfilePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/video/:videoId" element={<VideoPage />} />

                {/* Private routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/upload" element={<UploadVideoPage />} />
                  <Route path="/edit-profile" element={<EditProfilePage />} />
                  <Route path="/:receiverUsername/message" element={<ChatLayout />} />
                  <Route path="/messages" element={<ChatLayout />} />
                  <Route path="/live" element={<LivePage />} />
                  <Route path="/live/:remoteUsername" element={<LiveViewerPage />} />
                  <Route path="/friends" element={<FriendPage />} />
                  <Route path="/following" element={<FollowingPage />} />
                  <Route path="/playlist" element={<PlaylistPage />} />
                  <Route path="/manage-videos" element={<ManageVideosPage />} />
                  <Route path="/edit-video/:videoId" element={<EditVideoPage />} />
                </Route>
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
};

export default App;
