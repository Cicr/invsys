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
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// @title Inventory Service API
// @version 1.0
// @description High-throughput inventory tracking and CQRS management via Golang.
// @host localhost:8080
// @BasePath /api/v1
func main() {
	db.InitDB()
	kafka.InitProducer()
	kafka.StartConsumer()

	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, Idempotency-Key")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", handlers.HealthCheck)

		inventory := v1.Group("/inventory")
		inventory.Use(handlers.AuthMiddleware())
		{
			inventory.GET("", handlers.ListInventory)
			inventory.GET("/:productId", handlers.GetStock)
			inventory.GET("/:productId/history", handlers.GetHistory)

			admin := inventory.Group("")
			admin.Use(handlers.RoleMiddleware("admin"))
			{
				admin.POST("/add", handlers.AddStock)
				admin.POST("/deduct", handlers.DeductStock)
				admin.DELETE("/:productId", handlers.SoftDeleteInventory)
			}
		}
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
