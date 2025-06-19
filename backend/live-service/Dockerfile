# syntax=docker/dockerfile:1
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum
COPY live-service/go.mod live-service/go.sum ./live-service/

# Copy shared package
COPY shared ./shared

# Copy the rest of the service code
COPY live-service ./live-service

# Set working directory to service
WORKDIR /app/live-service

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
COPY --from=builder /app/live-service/app .
COPY --from=builder /bin/grpc_health_probe /bin/grpc_health_probe

EXPOSE 50056
ENTRYPOINT ["/app/app"]
