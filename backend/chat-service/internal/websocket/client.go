package websocket

import (
	"github.com/gorilla/websocket"
)

type Client struct {
	UserID uint64
	Conn   *websocket.Conn
	Send   chan []byte
	Hub    *Hub
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		// Forward this message to be broadcasted
		c.Hub.HandleMessage(message, c.UserID)
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for msg := range c.Send {
		c.Conn.WriteMessage(websocket.TextMessage, msg)
	}
	c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
}
