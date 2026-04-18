package db

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// DB wraps the sql.DB with convenience methods.
type DB struct {
	*sql.DB
}

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pushups (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       TEXT    NOT NULL,  -- stored as YYYY-MM-DD
    count      INTEGER NOT NULL CHECK(count > 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)         -- one record per user per day; use upsert to accumulate
);

CREATE TABLE IF NOT EXISTS referral_codes (
    id         		INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    		INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referral_code 	TEXT    NOT NULL UNIQUE,
    created_at 		DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at 		DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pushups_user_id ON pushups(user_id);
CREATE INDEX IF NOT EXISTS idx_pushups_date    ON pushups(date);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referral_codes ON referral_codes(referral_code);
`

// Initialize opens (or creates) the SQLite database at path and runs migrations.
func Initialize(path string) (*DB, error) {
	sqldb, err := sql.Open("sqlite3", fmt.Sprintf("%s?_foreign_keys=on&_journal_mode=WAL", path))
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if _, err := sqldb.Exec(schema); err != nil {
		return nil, fmt.Errorf("run schema: %w", err)
	}

	// Check if any referral codes exist
	var count int
	err = sqldb.QueryRow("SELECT COUNT(*) FROM referral_codes").Scan(&count)
	if err != nil {
		return nil, fmt.Errorf("check referral codes: %w", err)
	}

	// If no referral codes exist and DEFAULT_REFERRAL_CODE is set, create one
	if count == 0 {
		if defaultCode := os.Getenv("DEFAULT_REFERRAL_CODE"); defaultCode != "" {
			expiresAt := time.Now().Add(24 * time.Hour)
			_, err := sqldb.Exec(
				"INSERT INTO referral_codes (user_id, referral_code, expires_at) VALUES (NULL, ?, ?)",
				defaultCode, expiresAt.Format(time.RFC3339),
			)
			if err != nil {
				return nil, fmt.Errorf("insert default referral code: %w", err)
			}
		}
	}

	return &DB{sqldb}, nil
}
