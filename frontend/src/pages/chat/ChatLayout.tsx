import ChatFriendsSidebar from "./ChatFriendsSidebar";
import ChatPage from "./ChatPage";

export default function ChatLayout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <ChatFriendsSidebar />
      <div style={{ flex: 1 }}>
        <ChatPage />
      </div>
    </div>
  );
}
