#!/bin/bash
echo "=== AUTH-01 ==="
curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}'

echo -e "\n=== AUTH-05 ==="
curl -s -X GET http://localhost:3002/products

echo -e "\n=== AUTH-09 ==="
curl -s -X GET http://localhost:8080/api/v1/inventory/123

TOKEN_ADMIN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}' | jq -r .access_token)
TOKEN_USER=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"username":"user","password":"password"}' | jq -r .access_token)

echo -e "\n=== AUTH-11 ==="
curl -s -X POST http://localhost:3001/auth/refresh -H "Authorization: Bearer $TOKEN_ADMIN"

echo -e "\n=== AUTH-12 ==="
curl -s -X POST http://localhost:3001/auth/disable -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_ADMIN" -d '{"username":"newuser"}'

echo -e "\n=== PROD-01 ==="
res=$(curl -s -X POST http://localhost:3002/products -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_ADMIN" -d '{"name":"Sony Headphones","priceUsd":300}')
echo $res
PRODUCT_ID=$(echo $res | jq -r .id)

echo -e "\n=== PROD-02 ==="
curl -s -X GET http://localhost:3002/products -H "Authorization: Bearer $TOKEN_ADMIN"

echo -e "\n=== PROD-04 ==="
curl -s -X GET "http://localhost:3002/products/$PRODUCT_ID?currency=EUR" -H "Authorization: Bearer $TOKEN_ADMIN"

echo -e "\n=== PROD-05 ==="
curl -s -X GET "http://localhost:3002/products/$PRODUCT_ID?currency=INVALID" -H "Authorization: Bearer $TOKEN_ADMIN"

echo -e "\n=== PROD-07 ==="
curl -s -X PUT "http://localhost:3002/products/$PRODUCT_ID" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_ADMIN" -d '{"priceUsd":250}'

echo -e "\n=== PROD-11 ==="
curl -s -X PATCH "http://localhost:3002/products/$PRODUCT_ID" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_ADMIN" -d '{"name":"Sony Headphones V2"}'

echo -e "\n=== PROD-10 ==="
# delete product?
curl -s -X DELETE "http://localhost:3002/products/$PRODUCT_ID" -H "Authorization: Bearer $TOKEN_ADMIN"

echo -e "\n=== PROD-12 ==="
curl -s -X DELETE "http://localhost:3002/products/999999" -H "Authorization: Bearer $TOKEN_ADMIN"

echo -e "\n=== INV-01 ==="
# Add stock
curl -s -X POST http://localhost:8080/api/v1/inventory/add -H "Content-Type: application/json" -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":50}"

echo -e "\n=== INV-02 ==="
# Deduct stock
curl -s -X POST http://localhost:8080/api/v1/inventory/deduct -H "Content-Type: application/json" -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":5}"

echo -e "\n=== INV-03 ==="
# Prevent over deduct
curl -s -X POST http://localhost:8080/api/v1/inventory/deduct -H "Content-Type: application/json" -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":999}"

echo -e "\n=== RED-01 ==="
curl -o /dev/null -s -w "%{time_total}\n" "http://localhost:3002/products/$PRODUCT_ID?currency=EUR" -H "Authorization: Bearer $TOKEN_ADMIN"
