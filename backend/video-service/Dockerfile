# syntax=docker/dockerfile:1
FROM golang:1.24.3-bookworm AS builder

WORKDIR /app

# Copy go.mod and go.sum
COPY video-service/go.mod video-service/go.sum ./video-service/

# Copy shared package
COPY shared ./shared

# Copy the rest of the service code
COPY video-service ./video-service

WORKDIR /app/video-service
RUN go mod download

# Build the Go app
RUN go build -o app ./cmd

# Download grpc_health_probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.25 && \
    wget -qO /bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

# =============== Final image ===============
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install OS dependencies for faster-whisper + PyAV
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libavdevice-dev \
    libavfilter-dev \
    libavformat-dev \
    libavcodec-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy grpc_health_probe binary
COPY --from=builder /bin/grpc_health_probe /bin/grpc_health_probe

# Create venv and install Python deps
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --upgrade pip && \
    pip install faster-whisper googletrans==4.0.0-rc1

# Copy the Go binary and Python script
COPY --from=builder /app/video-service/app .
COPY video-service/internal/ai/caption_generator.py ./internal/ai/

# Create temp directory for generated files
RUN mkdir -p /app/temp

EXPOSE 50053

ENTRYPOINT ["/app/app"]
