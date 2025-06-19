# syntax=docker/dockerfile:1
FROM golang:1.24.4-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum
COPY user-service/go.mod user-service/go.sum ./user-service/

# Copy shared package
COPY shared ./shared

# Copy the rest of the service code
COPY user-service ./user-service

# Set working directory to service
WORKDIR /app/user-service

# Install git for Go module fetching
RUN apk add --no-cache git

# Download Go dependencies
RUN go mod download

# Build the binary
RUN go build -o app ./cmd

# Download grpc_health_probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.25 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

# Minimal final image
FROM gcr.io/distroless/base-debian11
WORKDIR /app

# Copy the binary and health probe
COPY --from=builder /app/user-service/app .
COPY --from=builder /bin/grpc_health_probe /bin/grpc_health_probe

EXPOSE 50051
ENTRYPOINT ["/app/app"]
