package db

import (
	"fmt"
	"log"
	"os"

	"github.com/invsys/inventory/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	host := os.Getenv("INVENTORY_DB_HOST")
	user := os.Getenv("INVENTORY_DB_USER")
	password := os.Getenv("INVENTORY_DB_PASSWORD")
	dbname := os.Getenv("INVENTORY_DB_NAME")
	port := os.Getenv("INVENTORY_DB_PORT")

	if host == "" {
		host = "localhost"
	}
	if port == "" {
		port = "5432"
	}
	if user == "" {
		user = "postgres"
	}
	if password == "" {
		password = "local_secret_password"
	}
	if dbname == "" {
		dbname = "inventory_db"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC", host, user, password, dbname, port)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(&models.InventoryItem{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database connection established and migrations run successfully")
}
