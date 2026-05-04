package kafka

import (
	"encoding/json"
	"testing"
	"github.com/invsys/inventory/models"
)

func TestKafkaJSONUnmarshalPanic(t *testing.T) {
	// Simulated corrupt payload
	corruptPayload := []byte(`{ "productId": "123", "action": `)
	
	var event models.KafkaProductEvent
	err := json.Unmarshal(corruptPayload, &event)
	if err == nil {
		t.Fatal("expected unmarshal to fail on corrupt payload")
	}
}
