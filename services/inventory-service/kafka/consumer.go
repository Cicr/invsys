package kafka

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/invsys/inventory/db"
	"github.com/invsys/inventory/models"
	"github.com/segmentio/kafka-go"
	"gorm.io/gorm"
)

func StartConsumer() {
	brokerUrl := os.Getenv("KAFKA_BROKER_URL")
	if brokerUrl == "" {
		brokerUrl = "localhost:9092"
	}

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{brokerUrl},
		GroupID:  "inventory-service-group",
		Topic:    "product.created",
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	log.Println("Kafka consumer started listening on product.created")

	go func() {
		for {
			m, err := reader.ReadMessage(context.Background())
			if err != nil {
				log.Printf("Error reading kafka message: %v\n", err)
				break
			}

			var event models.KafkaProductEvent
			if err := json.Unmarshal(m.Value, &event); err != nil {
				log.Printf("Failed to unmarshal kafka event: %v\n", err)
				continue
			}

			log.Printf("Received product.created event for ProductID: %s\n", event.ProductID)

			// Initialize stock ledger for new product
			var item models.InventoryItem
			err = db.DB.Transaction(func(tx *gorm.DB) error {
				if err := tx.Where("product_id = ?", event.ProductID).First(&item).Error; err != nil {
					if err == gorm.ErrRecordNotFound {
						item = models.InventoryItem{ProductID: event.ProductID, Quantity: 0}
						return tx.Create(&item).Error
					}
					return err
				}
				return nil
			})

			if err != nil {
				log.Printf("Failed to initialize stock for product %s: %v\n", event.ProductID, err)
			}
		}
	}()
}
