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

# Generate gRPC-Web files
proto-web:
	@echo "Generating gRPC-Web files..."
	protoc \
		-I=proto \
		--plugin=protoc-gen-ts_proto=D:/!_TPA/Web/tpa_web/frontend/node_modules/.bin/protoc-gen-ts_proto.cmd \
		--ts_proto_out=frontend/src/grpc/gen \
		--ts_proto_opt=outputClientImpl=grpc-web,esModuleInterop=true,forceLong=string,useOptionals=messages,outputRpcImpl=true \
		proto/*.proto

d:
	@echo "Building Docker images..."
	docker compose up -d --build