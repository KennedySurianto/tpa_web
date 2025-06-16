package database

import (
	"fmt"
	"os"

	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDatabase() *gorm.DB {
	dbURL := os.Getenv("DATABASE_URL")
	fmt.Println("[VIDEO_SERVICE_DB] Connecting to database at:", dbURL)
	if dbURL == "" {
		panic("DATABASE_URL environment variable is not set")
	}

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	err = db.AutoMigrate(
		&model.Video{},
		&model.Caption{},
	)
	if err != nil {
		panic(err)
	}

	fmt.Println("[VIDEO_SERVICE_DB] Database connection established successfully")
	return db
}
