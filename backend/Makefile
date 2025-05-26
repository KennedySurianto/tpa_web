.PHONY: proto proto-web build run run-user run-gateway clean

# Protobuf generation
proto:
	@echo "Generating protobuf files..."

	protoc -Iproto \
		--go_out=shared/gen/user --go_opt=paths=source_relative \
		--go-grpc_out=shared/gen/user --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=shared/gen/user --grpc-gateway_opt=paths=source_relative \
		proto/user.proto

	protoc -Iproto \
		--go_out=shared/gen/auth --go_opt=paths=source_relative \
		--go-grpc_out=shared/gen/auth --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=shared/gen/auth --grpc-gateway_opt=paths=source_relative \
		proto/auth.proto

# Generate gRPC-Web files
proto-web:
	@echo "Generating gRPC-Web files..."
	protoc \
		-I=proto \
		--plugin=protoc-gen-ts_proto=D:/!_TPA/Web/tpa_web/frontend/node_modules/.bin/protoc-gen-ts_proto.cmd \
		--ts_proto_out=../frontend/src/grpc/gen \
		--ts_proto_opt=outputClientImpl=grpc-web,esModuleInterop=true,forceLong=string,useOptionals=messages,outputRpcImpl=true \
		proto/*.proto

# Build services
build: proto
	@echo "Building user service..."
	cd user-service && go build -o ../bin/user-service ./cmd

# Run all services
run:
	@echo Running all services in new CMD windows...
	@start "" cmd /k "cd user-service && go run cmd/main.go"
	@start "" cmd /k "cd gateway && go run main.go"

# Run user service
run-user:
	@echo "Running user service..."
	cd user-service && go run ./cmd/main.go


# Run gateway service
run-gateway:
	@echo "Running gateway service..."
	cd gateway && go run main.go

# Install dependencies
deps:
	@echo "Installing dependencies..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	rm -rf shared/gen/