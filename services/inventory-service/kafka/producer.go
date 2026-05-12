package kafka

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"os"

	"github.com/invsys/inventory/models"
	"github.com/segmentio/kafka-go"
)

var writer *kafka.Writer
var MockPublish func(event models.KafkaInventoryEvent) error

func InitProducer() {
	brokerUrl := os.Getenv("KAFKA_BROKER_URL")
	if brokerUrl == "" {
		brokerUrl = "localhost:9092"
	}

	writer = &kafka.Writer{
		Addr:     kafka.TCP(brokerUrl),
		Topic:    "inventory.adjusted",
		Balancer: &kafka.LeastBytes{},
	}
	log.Println("Kafka producer initialized for inventory.adjusted")
}

func PublishInventoryEvent(event models.KafkaInventoryEvent) error {
	if MockPublish != nil {
		return MockPublish(event)
	}

	if writer == nil {
		InitProducer()
	}

	payloadBytes, err := json.Marshal(event)
	if err != nil {
		return err
	}
	payloadString := string(payloadBytes)

	secret := os.Getenv("KAFKA_HMAC_SECRET")
	if secret == "" {
		secret = "super-secret-key"
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payloadBytes)
	signature := hex.EncodeToString(mac.Sum(nil))

	signedMsg := map[string]string{
		"payload":   payloadString,
		"signature": signature,
	}
	finalPayload, _ := json.Marshal(signedMsg)

	err = writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(event.ProductID),
			Value: finalPayload,
		},
	)
	if err != nil {
		log.Printf("Failed to publish Kafka event: %v", err)
	}
	return err
}
