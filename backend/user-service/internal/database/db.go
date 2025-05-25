package database

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "github.com/KennedySurianto/tpa_web/backend/user-service/internal/model"
)

// Exported function
func ConnectDatabase() *gorm.DB {
    dbURL := "postgres://postgres:postgres@localhost:5432/user_service_db"
    // <username>:<password>@localhost:5432/<db_name>

    db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
    if err != nil {
        panic(err)
    }

    err = db.AutoMigrate(
        &model.User{},
    )

    if err != nil {
        panic(err)
    }
    
    return db
}