package kafka

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"os"

	"github.com/invsys/inventory/db"
	"github.com/invsys/inventory/models"
	"github.com/segmentio/kafka-go"
	"gorm.io/gorm"
)

type SignedKafkaMessage struct {
	Payload   string `json:"payload"`
	Signature string `json:"signature"`
}

func VerifySignature(payload []byte, signature string) bool {
	secret := os.Getenv("KAFKA_HMAC_SECRET")
	if secret == "" {
		secret = "super-secret-key"
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expectedMAC := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expectedMAC))
}

func sendToDLQ(topic string, rawPayload []byte, errMessage string) {
	dlqEvent := models.DeadLetterQueueEvent{
		Topic:        topic,
		Payload:      string(rawPayload),
		ErrorMessage: errMessage,
	}
	db.DB.Create(&dlqEvent)
}

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
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic in Kafka consumer: %v", r)
			}
		}()
		for {
			m, err := reader.ReadMessage(context.Background())
			if err != nil {
				log.Printf("Error reading kafka message: %v\n", err)
				break
			}

			var signedMsg SignedKafkaMessage
			if err := json.Unmarshal(m.Value, &signedMsg); err != nil {
				log.Printf("Failed to unmarshal signed message: %v\n", err)
				sendToDLQ(m.Topic, m.Value, "Invalid signed message envelope: "+err.Error())
				continue
			}

			if !VerifySignature([]byte(signedMsg.Payload), signedMsg.Signature) {
				log.Printf("Invalid signature for message\n")
				sendToDLQ(m.Topic, m.Value, "Invalid HMAC signature")
				continue
			}

			var event models.KafkaProductEvent
			if err := json.Unmarshal([]byte(signedMsg.Payload), &event); err != nil {
				log.Printf("Failed to unmarshal kafka event: %v\n", err)
				sendToDLQ(m.Topic, m.Value, "Failed to unmarshal product event payload: "+err.Error())
				continue
			}

			log.Printf("Received product.created event for ProductID: %s\n", event.ProductID)

			// Initialize stock ledger for new product
			var item models.InventoryItem
			err = db.DB.Transaction(func(tx *gorm.DB) error {
				idempotencyKey := "product.created-" + event.ProductID
				var count int64
				if err := tx.Model(&models.ProcessedRequest{}).Where("idempotency_key = ?", idempotencyKey).Count(&count).Error; err != nil {
					return err
				}
				if count > 0 {
					return nil // Already processed
				}
				if err := tx.Create(&models.ProcessedRequest{IdempotencyKey: idempotencyKey}).Error; err != nil {
					return err
				}

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
