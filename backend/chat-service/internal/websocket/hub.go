package websocket

import (
	"encoding/json"
	"sync"
)

type Hub struct {
	Clients    map[uint64]*Client
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

type IncomingMessage struct {
	Type       string `json:"type"`        // "text" or "unsend"
	ReceiverID uint64 `json:"receiver_id"` // Required
	Message    string `json:"message"`     // Only for text
	MessageID  string `json:"message_id"`  // Only for unsend
	Image      []byte `json:"image"` 		// Optional for image messages (Base64 encoded if using JSON)
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[uint64]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.UserID] = client
			h.mu.Unlock()
		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client.UserID]; ok {
				delete(h.Clients, client.UserID)
				close(client.Send)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) Broadcast(receiverID uint64, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if client, ok := h.Clients[receiverID]; ok {
		client.Send <- message
	}
}

func (h *Hub) HandleMessage(rawMsg []byte, senderID uint64) {
	var incoming IncomingMessage
	if err := json.Unmarshal(rawMsg, &incoming); err != nil {
		return
	}

	switch incoming.Type {
	case "text":
		outgoing := map[string]interface{}{
			"type":       "text",
			"sender_id":  senderID,
			"message":    incoming.Message,
		}
		jsonMsg, _ := json.Marshal(outgoing)
		h.Broadcast(incoming.ReceiverID, jsonMsg)
		h.Broadcast(senderID, jsonMsg)

	case "unsend":
		// Soft delete from DB (use service if DI is used)
		// Example: _ = chatService.UnsendMessage(incoming.MessageID)

		outgoing := map[string]interface{}{
			"type":       "unsend",
			"messageId":  incoming.MessageID,
		}
		jsonMsg, _ := json.Marshal(outgoing)
		h.Broadcast(incoming.ReceiverID, jsonMsg)
		h.Broadcast(senderID, jsonMsg)

	case "image":
		outgoing := map[string]interface{}{
			"type":       "image",
			"sender_id":  senderID,
			"image":      incoming.Image, // should already be []byte
			"message":    incoming.Message, // optional caption
		}
		jsonMsg, _ := json.Marshal(outgoing)
		h.Broadcast(incoming.ReceiverID, jsonMsg)
		h.Broadcast(senderID, jsonMsg)
	}
}
