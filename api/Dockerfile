FROM golang:1.26-alpine AS builder

# CGO is required for go-sqlite3
RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o pushup-tracker .

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM alpine:3.23
RUN apk add --no-cache sqlite-libs

WORKDIR /app
COPY --from=builder /app/pushup-tracker .

EXPOSE 8080
CMD ["./pushup-tracker"]
