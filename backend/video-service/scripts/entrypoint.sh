#!/bin/sh

# Configure MinIO alias and set anonymous access
mc alias set localminio http://host.docker.internal:9000 minioadmin minioadmin
mc anonymous set download localminio/videos

# Run the Go app
exec /app/app
