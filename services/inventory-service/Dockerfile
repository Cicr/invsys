FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build a statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -o inventory-service main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/inventory-service .

EXPOSE 8080
CMD ["./inventory-service"]
