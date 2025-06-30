package controller

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/service"
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/websocket"
	chatpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/chat"
)

type ChatController struct {
	chatpb.UnimplementedChatServiceServer
	service service.ChatService
	hub     *websocket.Hub 
}
func NewChatController(s service.ChatService, hub *websocket.Hub) *ChatController {
	return &ChatController{service: s, hub: hub}
}

func (h *ChatController) SendMessage(ctx context.Context, req *chatpb.SendMessageRequest) (*chatpb.SendMessageResponse, error) {
	chat := &model.Chat{
		SenderID:   uint(req.SenderId),
		ReceiverID: uint(req.ReceiverId),
		Type:       model.ChatType(req.Type),
		Message:    req.GetMessage(),
		Image: 		req.GetImage(),
	}

	saved, err := h.service.SendMessage(chat)
	if err != nil {
		return nil, err
	}

	response := &chatpb.Chat{
		Id:         uint64(saved.ID),
		SenderId:   uint64(saved.SenderID),
		ReceiverId: uint64(saved.ReceiverID),
		Type:       string(saved.Type),
		Message:    saved.Message,
		Image:      saved.Image,
		CreatedAt:  saved.CreatedAt.Format(time.RFC3339),
	}

	// Broadcast to receiver
	jsonBytes, _ := json.Marshal(response)
	h.hub.Broadcast(uint64(saved.ReceiverID), jsonBytes)

	return &chatpb.SendMessageResponse{Chat: response}, nil
}

func (h *ChatController) GetChatsByUserID(ctx context.Context, req *chatpb.GetChatsByUserIDRequest) (*chatpb.GetChatsByUserIDResponse, error) {
	chats, err := h.service.GetChatsByUserID(req.GetUserId())
	if err != nil {
		return nil, err
	}

	var pbChats []*chatpb.Chat
	for _, c := range chats {
		pbChats = append(pbChats, &chatpb.Chat{
			Id:         uint64(c.ID),
			SenderId:   uint64(c.SenderID),
			ReceiverId: uint64(c.ReceiverID),
			Type:       string(c.Type),
			Message:    c.Message,
			Image:		c.Image,
			CreatedAt:  c.CreatedAt.Format(time.RFC3339),
		})
	}

	return &chatpb.GetChatsByUserIDResponse{
		Chats: pbChats,
	}, nil
}

func (h *ChatController) GetChatsWithUser(ctx context.Context, req *chatpb.GetChatsWithUserRequest) (*chatpb.GetChatsWithUserResponse, error) {
	chats, err := h.service.GetChatsBetweenUsers(req.GetUser1Id(), req.GetUser2Id())
	if err != nil {
		return nil, err
	}

	var pbChats []*chatpb.Chat
	for _, c := range chats {
		pbChats = append(pbChats, &chatpb.Chat{
			Id:         uint64(c.ID),
			SenderId:   uint64(c.SenderID),
			ReceiverId: uint64(c.ReceiverID),
			Type:       string(c.Type),
			Message:    c.Message,
			Image: 		c.Image,
			CreatedAt:  c.CreatedAt.Format(time.RFC3339),
			UpdatedAt:  c.UpdatedAt.Format(time.RFC3339),
			DeletedAt:  func() string {
				if c.DeletedAt.Valid {
					return c.DeletedAt.Time.Format(time.RFC3339)
				}
				return ""
			}(),
		})
	}

	fmt.Println("[CHAT_CONTROLLER] Length of chats with user:", len(pbChats))
	return &chatpb.GetChatsWithUserResponse{Chats: pbChats}, nil
}

func (c *ChatController) UnsendMessage(ctx context.Context, req *chatpb.UnsendMessageRequest) (*chatpb.Empty, error) {
	err := c.service.UnsendMessage(req.ChatId)
	if err != nil {
		return nil, err
	}

	// Real-time broadcast to both sender and receiver
	payload := map[string]interface{}{
		"type":      "unsend",
		"messageId": fmt.Sprintf("%d", req.ChatId),
	}

	jsonBytes, _ := json.Marshal(payload)

	// Broadcast to both users
	c.hub.Broadcast(uint64(req.ReceiverId), jsonBytes)
	c.hub.Broadcast(uint64(req.SenderId), jsonBytes)

	return &chatpb.Empty{}, nil
}

func (h *ChatController) SetTypingStatus(ctx context.Context, req *chatpb.SetTypingStatusRequest) (*chatpb.Empty, error) {
	// Prepare the typing event
	typingEvent := map[string]interface{}{
		"type":       "typing",
		"sender_id":  req.SenderId,
		"receiver_id": req.ReceiverId,
		"is_typing":  req.IsTyping,  // true for typing, false for stop typing
	}

	// Log the typing status (for debugging purposes)
	fmt.Printf("Typing event: sender_id=%d, receiver_id=%d, is_typing=%v\n", req.SenderId, req.ReceiverId, req.IsTyping)

	// Marshal the event to JSON
	jsonBytes, err := json.Marshal(typingEvent)
	if err != nil {
		return nil, fmt.Errorf("error marshaling typing event: %v", err)
	}

	// Broadcast the typing status to the receiver via WebSocket
	h.hub.Broadcast(req.ReceiverId, jsonBytes)

	// Send the empty response back to the client
	return &chatpb.Empty{}, nil
}
