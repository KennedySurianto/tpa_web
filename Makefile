.PHONY: proto proto-web

# Protobuf generation
proto:
	@echo "Generating protobuf files..."

	protoc -Iproto \
		--go_out=backend/shared/gen/user --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/user --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/user --grpc-gateway_opt=paths=source_relative \
		proto/user.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/auth --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/auth --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/auth --grpc-gateway_opt=paths=source_relative \
		proto/auth.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/video --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/video --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/video --grpc-gateway_opt=paths=source_relative \
		proto/video.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/comment --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/comment --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/comment --grpc-gateway_opt=paths=source_relative \
		proto/comment.proto
	
	protoc -Iproto \
		--go_out=backend/shared/gen/like --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/like --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/like --grpc-gateway_opt=paths=source_relative \
		proto/like.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/watch --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/watch --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/watch --grpc-gateway_opt=paths=source_relative \
		proto/watch.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/like_comment --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/like_comment --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/like_comment --grpc-gateway_opt=paths=source_relative \
		proto/like_comment.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/follow --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/follow --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/follow --grpc-gateway_opt=paths=source_relative \
		proto/follow.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/chat --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/chat --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/chat --grpc-gateway_opt=paths=source_relative \
		proto/chat.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/live --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/live --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/live --grpc-gateway_opt=paths=source_relative \
		proto/live.proto
	
	protoc -Iproto \
		--go_out=backend/shared/gen/playlist --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/playlist --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/playlist --grpc-gateway_opt=paths=source_relative \
		proto/playlist.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/notification --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/notification --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/notification --grpc-gateway_opt=paths=source_relative \
		proto/notification.proto

	protoc -Iproto \
		--go_out=backend/shared/gen/favorite --go_opt=paths=source_relative \
		--go-grpc_out=backend/shared/gen/favorite --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=backend/shared/gen/favorite --grpc-gateway_opt=paths=source_relative \
		proto/favorite.proto

# Generate gRPC-Web files
	@echo "Generating gRPC-Web files..."
	protoc \
		-I=proto \
		--plugin=protoc-gen-ts_proto=D:/!_TPA/Web/tpa_web/frontend/node_modules/.bin/protoc-gen-ts_proto.cmd \
		--ts_proto_out=frontend/src/api/gen \
		--ts_proto_opt=outputClientImpl=grpc-web,esModuleInterop=true,forceLong=string,useOptionals=messages,outputRpcImpl=true \
		proto/*.proto

prod:
	@echo "Building Docker images..."
	docker compose up -d --build

dev:
	docker compose -f docker-compose.dev.yaml up --build