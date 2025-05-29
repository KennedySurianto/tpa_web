package storage

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinIOClient struct {
	Client *minio.Client
	Bucket string
}

func NewMinIOClient() *MinIOClient {
	endpoint := os.Getenv("MINIO_ENDPOINT")       // e.g., localhost:9000
	accessKey := os.Getenv("MINIO_ACCESS_KEY")    // e.g., minioadmin
	secretKey := os.Getenv("MINIO_SECRET_KEY")    // e.g., minioadmin
	bucket := os.Getenv("MINIO_BUCKET")           // e.g., videos

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: false, // true if using https
	})
	if err != nil {
		log.Fatalln("Failed to connect to MinIO:", err)
	}

	// Ensure bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		log.Fatalln("Error checking bucket:", err)
	}
	if !exists {
		err = client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			log.Fatalln("Could not create bucket:", err)
		}
	}

	fmt.Println("Connected to MinIO server at", endpoint)
	return &MinIOClient{Client: client, Bucket: bucket}
}

func (m *MinIOClient) UploadVideo(ctx context.Context, filename string, data []byte, contentType string) (string, error) {
	fmt.Println("[MINIO_CLIENT] Uploading video to MinIO with filename:", filename)
	_, err := m.Client.PutObject(
		ctx, 
		m.Bucket, 
		filename, 
		bytes.NewReader(data), int64(len(data)), 
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return "", err
	}

	fmt.Println("[MINIO_CLIENT] Video uploaded successfully with filename:", filename)
	return fmt.Sprintf("http://%s/%s/%s", m.Client.EndpointURL().Host, m.Bucket, filename), nil
}
