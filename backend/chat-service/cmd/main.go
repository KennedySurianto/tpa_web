package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/database"
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/service"
	chatws "github.com/KennedySurianto/tpa_web/backend/chat-service/internal/websocket"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/chat"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
)

func main() {
	port := getEnv("PORT", "50055")
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	hub := chatws.NewHub()
	go hub.Run()

	http.HandleFunc("/ws", chatws.ServeWebSocket(hub))
	http.HandleFunc("/ws/", chatws.ServeWebSocket(hub))

	go func() {
		log.Println("WebSocket server running at :8081/ws")
		if err := http.ListenAndServe(":8081", nil); err != nil {
			log.Fatalf("Failed to start WebSocket server: %v", err)
		}
	}()

	chatDB := database.ConnectDatabase()
	chatRepo := repository.NewChatRepository(chatDB)
	chatService := service.NewChatService(chatRepo)
	chatController := controller.NewChatController(chatService, hub)
	
	server := grpc.NewServer()
	pb.RegisterChatServiceServer(server, chatController)
	
	reflection.Register(server)

	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(server, healthServer)
	healthServer.SetServingStatus("chat.ChatService", grpc_health_v1.HealthCheckResponse_SERVING)

	go func() {
		log.Printf("Chat service starting on port %s...\n", port)
		if err := server.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	sig := <-c
	log.Printf("Received signal %s, shutting down...\n", sig)

	server.GracefulStop()
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}