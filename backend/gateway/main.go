package main

import (
	"context"
	"log"
	"net/http"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	userpb "github.com/KennedySurianto/tpa_web/shared/gen/user"

	"google.golang.org/grpc"
)

func main() {
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	mux := runtime.NewServeMux()

	opts := []grpc.DialOption{grpc.WithInsecure()}

	// Register user-service
	if err := userpb.RegisterUserServiceHandlerFromEndpoint(ctx, mux, "localhost:50051", opts); err != nil {
		log.Fatalf("Failed to register user-service: %v", err)
	}

	log.Println("🚀 Gateway running at http://localhost:8080")
	http.ListenAndServe(":8080", mux)
}
