# syntax=docker/dockerfile:1
FROM golang:1.24.3-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum
COPY auth-service/go.mod auth-service/go.sum ./auth-service/

# Copy shared package
COPY shared ./shared

# Copy the rest of the service code
COPY auth-service ./auth-service

# Set working directory to service
WORKDIR /app/auth-service

# Install git for Go module fetching
RUN apk add --no-cache git

# Download Go dependencies
RUN go mod download

# Build the binary
RUN go build -o app ./cmd

# Minimal final image
FROM gcr.io/distroless/base-debian11
WORKDIR /app
COPY --from=builder /app/auth-service/app .

EXPOSE 50052
ENTRYPOINT ["/app/app"]
