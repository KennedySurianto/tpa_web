# syntax=docker/dockerfile:1
FROM golang:1.24.3-alpine AS builder

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

# Minimal final image
FROM gcr.io/distroless/base-debian11
WORKDIR /app
COPY --from=builder /app/user-service/app .

EXPOSE 50051
ENTRYPOINT ["/app/app"]
