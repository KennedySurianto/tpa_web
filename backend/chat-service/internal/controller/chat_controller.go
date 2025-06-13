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
			CreatedAt:  c.CreatedAt.Format(time.RFC3339),
		})
	}

	fmt.Println("[CHAT_CONTROLLER] Length of chats with user:", len(pbChats))
	return &chatpb.GetChatsWithUserResponse{Chats: pbChats}, nil
}
