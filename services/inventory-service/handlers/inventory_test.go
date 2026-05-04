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

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

// setupTestDB initialises a GORM instance backed by go-sqlmock (no real DB).
func setupTestDB() sqlmock.Sqlmock {
	sqlDB, mock, _ := sqlmock.New()
	dialector := postgres.New(postgres.Config{
		Conn:       sqlDB,
		DriverName: "postgres",
	})
	db.DB, _ = gorm.Open(dialector, &gorm.Config{})
	return mock
}

// setupRouter builds a Gin engine in test mode with all inventory routes registered.
func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/health", HealthCheck)
	r.GET("/inventory/:productId", GetStock)
	r.POST("/inventory/add", AddStock)
	r.POST("/inventory/deduct", DeductStock)
	r.DELETE("/inventory/:productId", SoftDeleteInventory)
	return r
}

// inventoryRow returns a standard sqlmock row for an InventoryItem.
func inventoryRow(id uint, productID string, qty int) *sqlmock.Rows {
	return sqlmock.NewRows([]string{"id", "product_id", "quantity", "created_at", "updated_at", "deleted_at"}).
		AddRow(id, productID, qty, nil, nil, nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-09 / Health Check
// ─────────────────────────────────────────────────────────────────────────────

// TestHealthCheck validates the /health endpoint returns 200 when DB is reachable.
// Mirrors the expectation of AUTH-09 (open inventory endpoint, no JWT required).
func TestHealthCheck(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	mock.ExpectPing()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("AUTH-09/Health: expected %d, got %d", http.StatusOK, w.Code)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-09 / INV-04 — GET Stock Level
// ─────────────────────────────────────────────────────────────────────────────

// TestGetStock_Found validates returning an inventory record when it exists (INV-04).
func TestGetStock_Found(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("PROD-ABC", 1).
		WillReturnRows(inventoryRow(1, "PROD-ABC", 50))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/inventory/PROD-ABC", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("INV-04/GetStock: expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	var item models.InventoryItem
	if err := json.Unmarshal(w.Body.Bytes(), &item); err != nil {
		t.Fatalf("INV-04/GetStock: could not decode response: %v", err)
	}
	if item.ProductID != "PROD-ABC" {
		t.Errorf("INV-04/GetStock: expected productId PROD-ABC, got %s", item.ProductID)
	}
	if item.Quantity != 50 {
		t.Errorf("INV-04/GetStock: expected quantity 50, got %d", item.Quantity)
	}
}

// TestGetStock_NotFound validates 404 when inventory record does not exist (AUTH-09 edge).
func TestGetStock_NotFound(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("MISSING", 1).
		WillReturnRows(sqlmock.NewRows([]string{})) // empty — triggers ErrRecordNotFound

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/inventory/MISSING", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("GetStock_NotFound: expected 404, got %d", w.Code)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// INV-01 — Add Stock (POST /inventory/add)
// ─────────────────────────────────────────────────────────────────────────────

// TestAddStock_ExistingRecord validates incrementing quantity for an existing product (INV-01).
func TestAddStock_ExistingRecord(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	reqBody := models.StockMutationRequest{ProductID: "PROD-001", Quantity: 50}
	body, _ := json.Marshal(reqBody)

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("PROD-001", 1).
		WillReturnRows(inventoryRow(1, "PROD-001", 0))
	mock.ExpectExec(`UPDATE "inventory_items" SET.*`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/inventory/add", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("INV-01/AddStock: expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

// TestAddStock_NewRecord validates creating a new ledger entry when none exists (INV-01 Kafka-init path).
func TestAddStock_NewRecord(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	reqBody := models.StockMutationRequest{ProductID: "PROD-NEW", Quantity: 50}
	body, _ := json.Marshal(reqBody)

	mock.ExpectBegin()
	// No record found — triggers INSERT path
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("PROD-NEW", 1).
		WillReturnRows(sqlmock.NewRows([]string{}))
	// GORM Postgres INSERT uses RETURNING "id" — must be ExpectQuery not ExpectExec
	mock.ExpectQuery(`INSERT INTO "inventory_items".*RETURNING "id"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(2))
	mock.ExpectCommit()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/inventory/add", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("INV-01/AddStock_New: expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

// TestAddStock_InvalidPayload validates 400 on missing required fields.
func TestAddStock_InvalidPayload(t *testing.T) {
	_ = setupTestDB()
	r := setupRouter()

	// Send empty body — binding should fail
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/inventory/add", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("AddStock_Invalid: expected 400, got %d", w.Code)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// INV-02 — Deduct Stock (POST /inventory/deduct)
// ─────────────────────────────────────────────────────────────────────────────

// TestDeductStock validates a successful deduction when balance is sufficient (INV-02).
func TestDeductStock(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	// Balance: 50 — deduct 5 → 45
	reqBody := models.StockMutationRequest{ProductID: "PROD-001", Quantity: 5}
	body, _ := json.Marshal(reqBody)

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("PROD-001", 1).
		WillReturnRows(inventoryRow(1, "PROD-001", 50))
	mock.ExpectExec(`UPDATE "inventory_items" SET.*`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/inventory/deduct", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("INV-02/DeductStock: expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// INV-03 — Prevent Over-Deduction (POST /inventory/deduct)
// ─────────────────────────────────────────────────────────────────────────────

// TestDeductStock_Insufficient validates 409 when deduction exceeds balance (INV-03).
func TestDeductStock_Insufficient(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	// Balance: 45 — attempt to deduct 999
	reqBody := models.StockMutationRequest{ProductID: "PROD-001", Quantity: 999}
	body, _ := json.Marshal(reqBody)

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("PROD-001", 1).
		WillReturnRows(inventoryRow(1, "PROD-001", 45))
	mock.ExpectRollback()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/inventory/deduct", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("INV-03/OverDeduct: expected 409 Conflict, got %d — body: %s", w.Code, w.Body.String())
	}

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["error"] != "Insufficient stock" {
		t.Errorf("INV-03/OverDeduct: expected 'Insufficient stock', got '%s'", resp["error"])
	}
}

// TestDeductStock_ProductNotFound validates 400 when productId has no inventory record.
func TestDeductStock_ProductNotFound(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	reqBody := models.StockMutationRequest{ProductID: "GHOST-ID", Quantity: 10}
	body, _ := json.Marshal(reqBody)

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("GHOST-ID", 1).
		WillReturnRows(sqlmock.NewRows([]string{}))
	mock.ExpectRollback()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/inventory/deduct", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("DeductStock_NotFound: expected 400, got %d", w.Code)
	}
}

// TestDeductStock_InvalidPayload validates 400 on missing required fields.
func TestDeductStock_InvalidPayload(t *testing.T) {
	_ = setupTestDB()
	r := setupRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/inventory/deduct", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("DeductStock_Invalid: expected 400, got %d", w.Code)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Soft-Delete (DELETE /inventory/:productId)
// ─────────────────────────────────────────────────────────────────────────────

// TestSoftDeleteInventory_Found validates soft-deleting an existing inventory record.
func TestSoftDeleteInventory_Found(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	// First SELECT to find the record
	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("PROD-DEL", 1).
		WillReturnRows(inventoryRow(1, "PROD-DEL", 20))
	// GORM soft-delete issues an UPDATE setting deleted_at
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "inventory_items" SET "deleted_at".*`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, "/inventory/PROD-DEL", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("SoftDelete_Found: expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["productId"] != "PROD-DEL" {
		t.Errorf("SoftDelete_Found: expected productId PROD-DEL, got %s", resp["productId"])
	}
}

// TestSoftDeleteInventory_NotFound validates 404 when the inventory record does not exist.
func TestSoftDeleteInventory_NotFound(t *testing.T) {
	mock := setupTestDB()
	r := setupRouter()

	mock.ExpectQuery(`SELECT \* FROM "inventory_items" WHERE product_id = \$1.*`).
		WithArgs("NO-RECORD", 1).
		WillReturnRows(sqlmock.NewRows([]string{}))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, "/inventory/NO-RECORD", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("SoftDelete_NotFound: expected 404, got %d", w.Code)
	}
}
