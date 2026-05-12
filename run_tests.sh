#!/bin/bash
# ============================================================================
# run_tests.sh — Invsys Live Integration Test Suite
# Covers: AUTH-01, AUTH-05, AUTH-09, AUTH-11, AUTH-12
#         PROD-01 through PROD-12, INV-01 through INV-03, RED-01
#         COMPLEX-01: Multi-currency price table
#         COMPLEX-02: Price history ledger (10 mutations)
# ============================================================================

AUTH_URL="http://localhost:3001"
PROD_URL="http://localhost:3002"
INV_URL="http://localhost:8080"

# ── Colours ──────────────────────────────────────────────────────────────────
BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
RESET="\033[0m"

header() { echo -e "\n${BOLD}${CYAN}=== $1 ===${RESET}"; }

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — CORE AUTH TESTS
# ─────────────────────────────────────────────────────────────────────────────

header "AUTH-01"
curl -s -X POST $AUTH_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}'

header "AUTH-05"
curl -s -X GET $PROD_URL/products

header "AUTH-09"
curl -s -X GET $INV_URL/api/v1/inventory/123

TOKEN_ADMIN=$(curl -s -X POST $AUTH_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}' | jq -r .access_token)
TOKEN_USER=$(curl -s -X POST $AUTH_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"password"}' | jq -r .access_token)

header "AUTH-11"
curl -s -X POST $AUTH_URL/auth/refresh \
  -H "Authorization: Bearer $TOKEN_ADMIN"

header "AUTH-12"
curl -s -X POST $AUTH_URL/auth/disable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"username":"newuser"}'

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — PRODUCT LIFECYCLE TESTS
# ─────────────────────────────────────────────────────────────────────────────

header "PROD-01"
res=$(curl -s -X POST $PROD_URL/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"name":"Sony Headphones","priceUsd":300}')
echo $res
PRODUCT_ID=$(echo $res | jq -r .id)

header "PROD-02"
curl -s -X GET $PROD_URL/products \
  -H "Authorization: Bearer $TOKEN_ADMIN"

header "PROD-04"
curl -s -X GET "$PROD_URL/products/$PRODUCT_ID?currency=EUR" \
  -H "Authorization: Bearer $TOKEN_ADMIN"

header "PROD-05"
curl -s -X GET "$PROD_URL/products/$PRODUCT_ID?currency=INVALID" \
  -H "Authorization: Bearer $TOKEN_ADMIN"

header "PROD-07"
curl -s -X PUT "$PROD_URL/products/$PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"priceUsd":250}'

header "PROD-11"
curl -s -X PATCH "$PROD_URL/products/$PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"name":"Sony Headphones V2"}'

header "PROD-10"
curl -s -X DELETE "$PROD_URL/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN"

header "PROD-12"
curl -s -X DELETE "$PROD_URL/products/999999" \
  -H "Authorization: Bearer $TOKEN_ADMIN"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — INVENTORY TESTS
# ─────────────────────────────────────────────────────────────────────────────

header "INV-01"
curl -s -X POST $INV_URL/api/v1/inventory/add \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":50}"

header "INV-02"
curl -s -X POST $INV_URL/api/v1/inventory/deduct \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":5}"

header "INV-03"
curl -s -X POST $INV_URL/api/v1/inventory/deduct \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":999}"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — REDIS LATENCY BENCHMARK
# ─────────────────────────────────────────────────────────────────────────────

header "RED-01"
curl -o /dev/null -s -w "%{time_total}\n" \
  "$PROD_URL/products/$PRODUCT_ID?currency=EUR" \
  -H "Authorization: Bearer $TOKEN_ADMIN"

# =============================================================================
# COMPLEX-01 — Multi-Currency Price Table: "1 metter Copper pipe"
# =============================================================================
echo -e "\n${BOLD}${CYAN}================================================================${RESET}"
echo -e "${BOLD}${CYAN}  COMPLEX-01: Multi-Currency Pricing — '1 metter Copper pipe'${RESET}"
echo -e "${BOLD}${CYAN}================================================================${RESET}"

# Create the product with a USD base price of 12.50
PIPE_BASE_USD=12.50
echo -e "\n${YELLOW}► Creating product...${RESET}"
PIPE_RES=$(curl -s -X POST $PROD_URL/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d "{\"name\":\"1 metter Copper pipe\",\"priceUsd\":$PIPE_BASE_USD,\"category\":\"materials\",\"sku\":\"PIPE-CU-$RANDOM\"}")
echo $PIPE_RES | jq .
PIPE_ID=$(echo $PIPE_RES | jq -r .id)

if [ -z "$PIPE_ID" ] || [ "$PIPE_ID" = "null" ]; then
  echo "ERROR: Could not create product. Aborting COMPLEX-01."
  exit 1
fi

# Fetch converted prices for DOP, EUR, CNY
echo -e "\n${YELLOW}► Fetching exchange rates...${RESET}"
DATE_NOW=$(date -u +"%Y-%m-%dT%H:%M:%S UTC")

DOP_RES=$(curl -s -X GET "$PROD_URL/products/$PIPE_ID?currency=DOP" \
  -H "Authorization: Bearer $TOKEN_ADMIN")
EUR_RES=$(curl -s -X GET "$PROD_URL/products/$PIPE_ID?currency=EUR" \
  -H "Authorization: Bearer $TOKEN_ADMIN")
CNY_RES=$(curl -s -X GET "$PROD_URL/products/$PIPE_ID?currency=CNY" \
  -H "Authorization: Bearer $TOKEN_ADMIN")

PRICE_DOP=$(echo $DOP_RES | jq -r '.priceDOP // "N/A"')
PRICE_EUR=$(echo $EUR_RES | jq -r '.priceEUR // "N/A"')
PRICE_CNY=$(echo $CNY_RES | jq -r '.priceCNY // "N/A"')

# Derive exchange rates from converted price / base
if [ "$PRICE_DOP" != "N/A" ]; then
  RATE_DOP=$(echo | awk "{ printf \"%.4f\", $PRICE_DOP / $PIPE_BASE_USD }")
else RATE_DOP="N/A"; fi
if [ "$PRICE_EUR" != "N/A" ]; then
  RATE_EUR=$(echo | awk "{ printf \"%.4f\", $PRICE_EUR / $PIPE_BASE_USD }")
else RATE_EUR="N/A"; fi
if [ "$PRICE_CNY" != "N/A" ]; then
  RATE_CNY=$(echo | awk "{ printf \"%.4f\", $PRICE_CNY / $PIPE_BASE_USD }")
else RATE_CNY="N/A"; fi

echo -e "\n${BOLD}Product:${RESET} 1 metter Copper pipe   |   ${BOLD}Base (USD):${RESET} \$$PIPE_BASE_USD   |   ${BOLD}Date:${RESET} $DATE_NOW"
echo ""
printf "${BOLD}%-12s %-16s %-14s %-20s${RESET}\n" "Currency" "Exchange Rate" "Converted \$" "Rate Date"
printf '%.0s─' {1..65}; echo ""
printf "%-12s %-16s %-14s %-20s\n" "USD (base)" "1.0000"         "\$$PIPE_BASE_USD"    "$DATE_NOW"
printf "%-12s %-16s %-14s %-20s\n" "DOP"        "$RATE_DOP"       "\$$PRICE_DOP"        "$DATE_NOW"
printf "%-12s %-16s %-14s %-20s\n" "EUR"        "$RATE_EUR"       "€$PRICE_EUR"         "$DATE_NOW"
printf "%-12s %-16s %-14s %-20s\n" "CNY (Yuan)" "$RATE_CNY"       "¥$PRICE_CNY"         "$DATE_NOW"

# =============================================================================
# COMPLEX-02 — Price History: 10 consecutive price mutations
# =============================================================================
echo -e "\n${BOLD}${CYAN}================================================================${RESET}"
echo -e "${BOLD}${CYAN}  COMPLEX-02: Price History — 10 price mutations${RESET}"
echo -e "${BOLD}${CYAN}================================================================${RESET}"

echo -e "\n${YELLOW}► Applying 10 price changes to product ID: $PIPE_ID${RESET}\n"

PRICES=(14.00 15.50 13.75 16.00 18.25 17.00 20.00 19.50 22.00 25.00)
IDX=1
for PRICE in "${PRICES[@]}"; do
  echo -n "  Mutation $IDX/10 → \$$PRICE ... "
  RESP=$(curl -s -X PUT "$PROD_URL/products/$PIPE_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_ADMIN" \
    -d "{\"priceUsd\":$PRICE}")
  NEW=$(echo $RESP | jq -r .priceUsd)
  echo -e "${GREEN}✓ priceUsd = \$$NEW${RESET}"
  IDX=$((IDX+1))
  sleep 0.1   # slight delay so timestamps are distinct
done

echo -e "\n${YELLOW}► Fetching price history ledger...${RESET}"
HISTORY=$(curl -s -X GET "$PROD_URL/products/$PIPE_ID/history" \
  -H "Authorization: Bearer $TOKEN_ADMIN")

ENTRY_COUNT=$(echo $HISTORY | jq 'length')
echo -e "\n${BOLD}Product:${RESET} 1 metter Copper pipe  |  ${BOLD}Total History Entries:${RESET} $ENTRY_COUNT"
echo ""
printf "${BOLD}%-6s %-14s %-14s %-30s${RESET}\n" "#" "Old Price (USD)" "New Price (USD)" "Changed At"
printf '%.0s─' {1..68}; echo ""

echo $HISTORY | jq -r 'to_entries[] | [(.key+1|tostring), ("$"+(.value.oldPriceUsd|tostring)), ("$"+(.value.newPriceUsd|tostring)), .value.changedAt] | @tsv' | \
while IFS=$'\t' read -r num old new ts; do
  printf "%-6s %-14s %-14s %-30s\n" "$num" "$old" "$new" "$ts"
done

echo -e "\n${BOLD}${GREEN}COMPLEX-01 and COMPLEX-02 completed.${RESET}"
echo -e "${BOLD}Product ID: $PIPE_ID${RESET}"
