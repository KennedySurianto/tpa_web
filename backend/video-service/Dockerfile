# syntax=docker/dockerfile:1
FROM golang:1.24.3-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum
COPY video-service/go.mod video-service/go.sum ./video-service/

# Copy shared package
COPY shared ./shared

# Copy the rest of the service code
COPY video-service ./video-service

# Set working directory to service
WORKDIR /app/video-service

# Install git for Go module fetching
RUN apk add --no-cache git

# Download Go dependencies
RUN go mod download

# Build the binary
RUN go build -o app ./cmd

# Minimal final image
FROM gcr.io/distroless/base-debian11
WORKDIR /app
COPY --from=builder /app/video-service/app .

EXPOSE 50051
ENTRYPOINT ["/app/app"]
