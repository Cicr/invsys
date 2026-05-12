package models

import (
	"time"

	"gorm.io/gorm"
)

type InventoryItem struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	ProductID string         `gorm:"uniqueIndex;not null" json:"productId"`
	Quantity  int            `gorm:"not null;default:0" json:"quantity"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type StockMutationRequest struct {
	ProductID string `json:"productId" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,gt=0"`
}

type KafkaProductEvent struct {
	ProductID string `json:"productId"`
	Action    string `json:"action"` // e.g., "product.created"
}

type ProcessedRequest struct {
	IdempotencyKey string    `gorm:"primaryKey;type:varchar(255)" json:"idempotencyKey"`
	CreatedAt      time.Time `json:"createdAt"`
}

type InventoryMovement struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	ProductID string    `gorm:"index;not null" json:"productId"`
	Delta     int       `gorm:"not null" json:"delta"`
	Action    string    `gorm:"not null" json:"action"` // e.g., "add", "deduct"
	CreatedAt time.Time `json:"createdAt"`
}

type KafkaInventoryEvent struct {
	ProductID string `json:"productId"`
	Action    string `json:"action"` // e.g., "inventory.adjusted"
	Delta     int    `json:"delta"`
	Total     int    `json:"total"`
}

type DeadLetterQueueEvent struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	Topic        string    `json:"topic"`
	Payload      string    `json:"payload"`
	ErrorMessage string    `json:"errorMessage"`
	CreatedAt    time.Time `json:"createdAt"`
}
