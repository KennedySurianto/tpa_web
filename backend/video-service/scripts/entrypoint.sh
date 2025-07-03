#!/bin/sh

# Configure MinIO alias and set anonymous access
mc alias set localminio http://host.docker.internal:9000 minioadmin minioadmin
mc anonymous set download localminio/videos
mc anonymous set download localminio/ads

# Run the Go app
exec /app/tmp/app
