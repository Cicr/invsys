package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/invsys/inventory/db"
	"github.com/invsys/inventory/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupTestDB() sqlmock.Sqlmock {
	sqlDB, mock, _ := sqlmock.New()
	dialector := postgres.New(postgres.Config{
		Conn:       sqlDB,
		DriverName: "postgres",
	})
	db.DB, _ = gorm.Open(dialector, &gorm.Config{})
	return mock
}

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/health", HealthCheck)
	r.POST("/inventory/add", AddStock)
	r.POST("/inventory/deduct", DeductStock)
	return r
}

func TestHealthCheck(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	mock.ExpectPing()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected %d, got %d", http.StatusOK, w.Code)
	}
}

func TestAddStock(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	reqBody := models.StockMutationRequest{ProductID: "P123", Quantity: 5}
	body, _ := json.Marshal(reqBody)

	// Mocking transaction
	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("P123", 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "product_id", "quantity"}).AddRow(1, "P123", 10))
	mock.ExpectExec(`UPDATE "inventory_items" SET.*`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/inventory/add", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
	}
}

func TestDeductStock(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	reqBody := models.StockMutationRequest{ProductID: "P123", Quantity: 5}
	body, _ := json.Marshal(reqBody)

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("P123", 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "product_id", "quantity"}).AddRow(1, "P123", 10))
	mock.ExpectExec(`UPDATE "inventory_items" SET.*`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/inventory/deduct", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
	}
}

func TestDeductStock_Insufficient(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	reqBody := models.StockMutationRequest{ProductID: "P123", Quantity: 50}
	body, _ := json.Marshal(reqBody)

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("P123", 1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "product_id", "quantity"}).AddRow(1, "P123", 10))
	mock.ExpectRollback()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/inventory/deduct", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("Expected 409 Conflict, got %d", w.Code)
	}
}
