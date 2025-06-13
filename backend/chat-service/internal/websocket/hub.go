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
	ReceiverID uint64 `json:"receiver_id"`
	Message    string `json:"message"`
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

	outgoing := map[string]interface{}{
		"sender_id":  senderID,
		"message":    incoming.Message,
	}
	jsonMsg, err := json.Marshal(outgoing)
	if err != nil {
		return
	}

	// Send to receiver
	h.Broadcast(incoming.ReceiverID, jsonMsg)

	// Send to sender
	h.Broadcast(senderID, jsonMsg)
}
