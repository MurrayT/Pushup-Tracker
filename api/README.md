# Pushup Tracker API

A REST API written in Go that tracks daily pushup counts per user, backed by SQLite.

## Features

- User registration and login with JWT authentication
- Users can only write their own data; anyone can read any user's data
- Graph-ready GET endpoint: data grouped by user and sorted by date
- Filter by date range and/or specific users
- Single-binary deployment, no external services required

## Project Structure

```
pushup-tracker/
├── main.go              # Entry point, routing
├── auth/
│   ├── jwt.go           # HS256 JWT generation & validation (stdlib only)
│   └── password.go      # Password hashing (SHA-256 + salt; swap for bcrypt in prod)
├── db/
│   ├── db.go            # SQLite init & schema migrations
│   ├── users.go         # User queries
│   ├── referrals.go     # Referral code queries
│   ├── pushups.go       # Pushup queries + graph response types
│   └── errors.go        # Shared DB error helpers
├── handlers/
│   └── handlers.go      # All HTTP handlers
├── middleware/
│   └── auth.go          # JWT auth middleware
├── Dockerfile
└── README.md
```

## Running Locally

### Prerequisites

- Go 1.26+
- GCC (required by `go-sqlite3` for CGO compilation)
  - macOS: `xcode-select --install`
  - Ubuntu/Debian: `apt install build-essential`
  - Alpine: `apk add gcc musl-dev`

### Steps

```bash
# 1. Download dependencies
go mod tidy

# 2. Run (database file created automatically)
JWT_SECRET=your-secret-here go run .

# Server starts on :8080 by default
# Override with: PORT=9000 go run .
```

### Docker

```bash
docker build -t pushup-tracker .
docker run -p 8080:8080 -e JWT_SECRET=your-secret pushup-tracker
```

---

## API Reference

All protected endpoints require the header:
```
Authorization: Bearer <token>
```

### Auth

#### `POST /api/auth/register`
Create a new account.

**Request:**
```json
{
  "username": "alice",
  "password": "s3cr3t",
  "referral_code": "referral"
}
```

**Response `201`:**
```json
{
  "user": { "id": 1, "username": "alice", "created_at": "..." },
  "token": "<jwt>"
}
```

---

#### `POST /api/auth/login`

**Request:**
```json
{ "username": "alice", "password": "s3cr3t" }
```

**Response `200`:**
```json
{
  "user": { ... },
  "token": "<jwt>"
}
```

---

### Users

#### `GET /api/users` 🔒

Returns all registered users (no passwords).

**Response `200`:**
```json
{
  "users": [
    { "id": 1, "username": "alice", "created_at": "..." },
    { "id": 2, "username": "bob",   "created_at": "..." }
  ]
}
```

### Referrals

#### `GET /api/referral` 🔒

Creates a new referral code that can be shared with friends.

**Request:**
```json
{ "referral_code": "shar3Me" }
```

**Response `201`:**
```json
{
  "referral_code": "shar3Me"
}
```
---

### Pushups

#### `POST /api/pushups` 🔒

Record pushups for the authenticated user. Calling again for the same date **replaces** the count for that day.

**Request:**
```json
{
  "date": "2024-01-15",
  "count": 50
}
```
`date` is optional — defaults to today (UTC).

**Response `200`:**
```json
{ "user_id": 1, "username": "alice", "date": "2024-01-15", "count": 50 }
```

---

#### `GET /api/pushups` 🔒

Returns all pushup data, shaped for graphing. Supports filtering.

**Query Parameters:**

| Param      | Type          | Description                          |
|------------|---------------|--------------------------------------|
| `start`    | `YYYY-MM-DD`  | Earliest date (inclusive)            |
| `end`      | `YYYY-MM-DD`  | Latest date (inclusive)              |
| `user_ids` | `1,2,3`       | Comma-separated list of user IDs     |

**Example:** `GET /api/pushups?start=2024-01-01&end=2024-01-31`

**Response `200`:**
```json
{
  "points": [
    { "date": "2024-01-01", "user_id": 1, "username": "alice", "count": 40 },
    { "date": "2024-01-01", "user_id": 2, "username": "bob",   "count": 30 },
    { "date": "2024-01-02", "user_id": 1, "username": "alice", "count": 55 }
  ],
  "users": [
    { "user_id": 1, "username": "alice", "total": 95, "days": 2 },
    { "user_id": 2, "username": "bob",   "total": 30, "days": 1 }
  ]
}
```

`points` is sorted by `date ASC, username ASC` — ready to feed directly into Chart.js, Recharts, or any charting library. Group by `username` to get per-user series.

---

#### `GET /api/pushups/{user_id}` 🔒

Same response shape as above, but filtered to a single user. Any authenticated user can view any other user's data.

**Example:** `GET /api/pushups/2?start=2024-01-01`

---

## Graph Data Usage

The `points` array is designed to map directly to a multi-series line/bar chart:

```js
// Example with Recharts / Chart.js
// Group points by username to get one series per user:
const series = {};
for (const p of data.points) {
  if (!series[p.username]) series[p.username] = [];
  series[p.username].push({ x: p.date, y: p.count });
}
```

---

## Production Notes

1. **Password hashing** — The default uses SHA-256 + random salt (stdlib only). For production, replace with `golang.org/x/crypto/bcrypt`:
   ```go
   // auth.tsx/password.go
   import "golang.org/x/crypto/bcrypt"
   hash, _ := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
   bcrypt.CompareHashAndPassword([]byte(stored), []byte(plain))
   ```

2. **JWT secret** — Always set `JWT_SECRET` env var in production. Without it a new random key is generated on each restart, invalidating all existing tokens.

3. **HTTPS** — Run behind a reverse proxy (nginx, Caddy) that terminates TLS.

4. **Database backups** — SQLite WAL mode is enabled; back up `pushups.db` regularly.
