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
