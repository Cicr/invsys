package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/invsys/inventory/db"
	"github.com/invsys/inventory/kafka"
	"github.com/invsys/inventory/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB() {
	var err error
	db.DB, err = gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	db.DB.AutoMigrate(&models.InventoryItem{}, &models.ProcessedRequest{}, &models.InventoryMovement{})
}

func generateAdminToken() string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  "user-123",
		"role": "admin",
		"exp":  time.Now().Add(time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString([]byte("mock_secret"))
	return tokenString
}

func generateUserToken() string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  "user-456",
		"role": "user",
		"exp":  time.Now().Add(time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString([]byte("mock_secret"))
	return tokenString
}

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	os.Setenv("JWT_SECRET", "mock_secret")
	r := gin.Default()
	
	inventory := r.Group("/inventory")
	inventory.Use(AuthMiddleware())
	{
		inventory.GET("/:productId", GetStock)
		admin := inventory.Group("")
		admin.Use(RoleMiddleware("admin"))
		{
			admin.POST("/add", AddStock)
			admin.POST("/deduct", DeductStock)
		}
	}
	return r
}

func TestAddStock_Admin(t *testing.T) {
	setupTestDB()
	r := setupTestRouter()

	kafka.MockPublish = func(event models.KafkaInventoryEvent) error {
		return nil // mock success
	}

	reqBody := models.StockMutationRequest{
		ProductID: "prod-1",
		Quantity:  10,
	}
	jsonBody, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/inventory/add", bytes.NewBuffer(jsonBody))
	req.Header.Set("Authorization", "Bearer "+generateAdminToken())
	req.Header.Set("Idempotency-Key", "key-1")
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", w.Code)
	}

	// Test Idempotency
	req2, _ := http.NewRequest(http.MethodPost, "/inventory/add", bytes.NewBuffer(jsonBody))
	req2.Header.Set("Authorization", "Bearer "+generateAdminToken())
	req2.Header.Set("Idempotency-Key", "key-1")
	req2.Header.Set("Content-Type", "application/json")

	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("Expected status 200 on duplicate request, got %d", w2.Code)
	}

	// Ensure quantity is still 10, not 20
	var item models.InventoryItem
	db.DB.Where("product_id = ?", "prod-1").First(&item)
	if item.Quantity != 10 {
		t.Fatalf("Expected quantity 10 due to idempotency, got %d", item.Quantity)
	}
}

func TestAddStock_ForbiddenUser(t *testing.T) {
	setupTestDB()
	r := setupTestRouter()

	reqBody := models.StockMutationRequest{
		ProductID: "prod-1",
		Quantity:  10,
	}
	jsonBody, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/inventory/add", bytes.NewBuffer(jsonBody))
	req.Header.Set("Authorization", "Bearer "+generateUserToken())
	req.Header.Set("Idempotency-Key", "key-2")
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("Expected status 403 Forbidden, got %d", w.Code)
	}
}

func TestDeductStock_Insufficient(t *testing.T) {
	setupTestDB()
	r := setupTestRouter()

	db.DB.Create(&models.InventoryItem{ProductID: "prod-2", Quantity: 5})

	reqBody := models.StockMutationRequest{
		ProductID: "prod-2",
		Quantity:  10,
	}
	jsonBody, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/inventory/deduct", bytes.NewBuffer(jsonBody))
	req.Header.Set("Authorization", "Bearer "+generateAdminToken())
	req.Header.Set("Idempotency-Key", "key-3")
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("Expected status 409 Conflict for insufficient stock, got %d", w.Code)
	}
}
