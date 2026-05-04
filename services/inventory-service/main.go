package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/invsys/inventory/db"
	"github.com/invsys/inventory/handlers"
	"github.com/invsys/inventory/kafka"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/invsys/inventory/docs" // swagger docs injected here
)

// @title Inventory Service API
// @version 1.0
// @description High-throughput inventory tracking and CQRS management via Golang.
// @host localhost:8080
// @BasePath /api/v1
func main() {
	db.InitDB()
	kafka.StartConsumer()

	r := gin.Default()

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", handlers.HealthCheck)
		v1.POST("/inventory/add", handlers.AddStock)
		v1.POST("/inventory/deduct", handlers.DeductStock)
		v1.GET("/inventory/:productId", handlers.GetStock)
		v1.DELETE("/inventory/:productId", handlers.SoftDeleteInventory)
	}

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	port := os.Getenv("INVENTORY_APP_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Inventory Service starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
