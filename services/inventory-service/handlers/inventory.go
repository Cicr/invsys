package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/invsys/inventory/db"
	"github.com/invsys/inventory/kafka"
	"github.com/invsys/inventory/models"
	"gorm.io/gorm"
)

var ErrDuplicateRequest = errors.New("duplicate request")

// ListInventory godoc
// @Summary List All Inventory
// @Description Get current stock levels for all products
// @Tags inventory
// @Produce json
// @Success 200 {array} models.InventoryItem
// @Failure 500 {object} map[string]string
// @Router /inventory [get]
func ListInventory(c *gin.Context) {
	var items []models.InventoryItem
	if err := db.DB.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory list"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GetStock godoc
// @Summary Get Inventory
// @Description Get current stock level for a product
// @Tags inventory
// @Produce json
// @Param productId path string true "Product ID"
// @Success 200 {object} models.InventoryItem
// @Failure 404 {object} map[string]string
// @Router /inventory/{productId} [get]
func GetStock(c *gin.Context) {
	productID := c.Param("productId")
	var item models.InventoryItem
	if err := db.DB.Where("product_id = ?", productID).First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Inventory record not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// GetHistory godoc
// @Summary Get Inventory History
// @Description Get movement history for a product
// @Tags inventory
// @Produce json
// @Param productId path string true "Product ID"
// @Success 200 {array} models.InventoryMovement
// @Failure 500 {object} map[string]string
// @Router /inventory/{productId}/history [get]
func GetHistory(c *gin.Context) {
	productID := c.Param("productId")
	var movements []models.InventoryMovement
	if err := db.DB.Where("product_id = ?", productID).Order("created_at desc").Find(&movements).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}
	c.JSON(http.StatusOK, movements)
}

// SoftDeleteInventory godoc
// @Summary Soft-Delete Inventory
// @Description Archive (soft-delete) a product's inventory ledger entry. The record is retained in DB with deleted_at set.
// @Tags inventory
// @Produce json
// @Param productId path string true "Product ID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /inventory/{productId} [delete]
func SoftDeleteInventory(c *gin.Context) {
	productID := c.Param("productId")
	var item models.InventoryItem
	if err := db.DB.Where("product_id = ?", productID).First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Inventory record not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find inventory record"})
		return
	}
	// GORM soft-delete: sets deleted_at timestamp, record is retained in DB
	if err := db.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to archive inventory record"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Inventory record archived", "productId": productID})
}

// HealthCheck godoc
// @Summary Health Check
// @Description responds with status ok
// @Tags health
// @Produce json
// @Success 200 {object} map[string]string
// @Router /health [get]
func HealthCheck(c *gin.Context) {
	sqlDB, err := db.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "database unavailable"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// AddStock godoc
// @Summary Add Stock
// @Description Add quantity to a product's inventory
// @Tags inventory
// @Accept json
// @Produce json
// @Param request body models.StockMutationRequest true "Stock Add Request"
// @Success 200 {object} models.InventoryItem
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /inventory/add [post]
func AddStock(c *gin.Context) {
	idempotencyKey := c.GetHeader("Idempotency-Key")
	if idempotencyKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Idempotency-Key header is required"})
		return
	}

	var req models.StockMutationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var item models.InventoryItem
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&models.ProcessedRequest{}).Where("idempotency_key = ?", idempotencyKey).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return ErrDuplicateRequest
		}
		if err := tx.Create(&models.ProcessedRequest{IdempotencyKey: idempotencyKey}).Error; err != nil {
			return err
		}

		// Acquire a pessimistic lock
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("product_id = ?", req.ProductID).First(&item).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create if not exists
				item = models.InventoryItem{ProductID: req.ProductID, Quantity: req.Quantity}
				return tx.Create(&item).Error
			}
			return err
		}

		item.Quantity += req.Quantity
		if err := tx.Save(&item).Error; err != nil {
			return err
		}

		movement := models.InventoryMovement{
			ProductID: req.ProductID,
			Delta:     req.Quantity,
			Action:    "add",
		}
		return tx.Create(&movement).Error
	})

	if err != nil {
		if errors.Is(err, ErrDuplicateRequest) {
			db.DB.Where("product_id = ?", req.ProductID).First(&item)
			c.JSON(http.StatusOK, item)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add stock"})
		return
	}

	kafka.PublishInventoryEvent(models.KafkaInventoryEvent{
		ProductID: item.ProductID,
		Action:    "inventory.adjusted",
		Delta:     req.Quantity,
		Total:     item.Quantity,
	})

	c.JSON(http.StatusOK, item)
}

// DeductStock godoc
// @Summary Deduct Stock
// @Description Deduct quantity from a product's inventory
// @Tags inventory
// @Accept json
// @Produce json
// @Param request body models.StockMutationRequest true "Stock Deduct Request"
// @Success 200 {object} models.InventoryItem
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /inventory/deduct [post]
func DeductStock(c *gin.Context) {
	idempotencyKey := c.GetHeader("Idempotency-Key")
	if idempotencyKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Idempotency-Key header is required"})
		return
	}

	var req models.StockMutationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var item models.InventoryItem
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&models.ProcessedRequest{}).Where("idempotency_key = ?", idempotencyKey).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return ErrDuplicateRequest
		}
		if err := tx.Create(&models.ProcessedRequest{IdempotencyKey: idempotencyKey}).Error; err != nil {
			return err
		}

		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("product_id = ?", req.ProductID).First(&item).Error; err != nil {
			return err
		}

		if item.Quantity < req.Quantity {
			return gorm.ErrInvalidData // Using as a proxy for insufficient stock
		}

		item.Quantity -= req.Quantity
		if err := tx.Save(&item).Error; err != nil {
			return err
		}

		movement := models.InventoryMovement{
			ProductID: req.ProductID,
			Delta:     -req.Quantity,
			Action:    "deduct",
		}
		return tx.Create(&movement).Error
	})

	if err != nil {
		if errors.Is(err, ErrDuplicateRequest) {
			db.DB.Where("product_id = ?", req.ProductID).First(&item)
			c.JSON(http.StatusOK, item)
			return
		}
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Product not found"})
			return
		}
		if err == gorm.ErrInvalidData {
			c.JSON(http.StatusConflict, gin.H{"error": "Insufficient stock"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deduct stock"})
		return
	}

	kafka.PublishInventoryEvent(models.KafkaInventoryEvent{
		ProductID: item.ProductID,
		Action:    "inventory.adjusted",
		Delta:     -req.Quantity,
		Total:     item.Quantity,
	})

	c.JSON(http.StatusOK, item)
}
