package db

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// User represents a registered account.
type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// ErrNotFound is returned when a record does not exist.
var ErrNotFound = errors.New("not found")

// ErrDuplicate is returned on unique constraint violations.
var ErrDuplicate = errors.New("already exists")

// CreateUser inserts a new user and returns the populated struct.
// passwordHash should be a bcrypt hash of the plain-text password.
func (db *DB) CreateUser(username, email, passwordHash string) (*User, error) {
	res, err := db.Exec(
		`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
		username, email, passwordHash,
	)
	if err != nil {
		if isUniqueErr(err) {
			return nil, ErrDuplicate
		}
		return nil, fmt.Errorf("create user: %w", err)
	}

	id, _ := res.LastInsertId()
	return db.GetUserByID(id)
}

// GetUserByID fetches a user by primary key.
func (db *DB) GetUserByID(id int64) (*User, error) {
	u := &User{}
	err := db.QueryRow(
		`SELECT id, username, email, created_at FROM users WHERE id = ?`, id,
	).Scan(&u.ID, &u.Username, &u.Email, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return u, nil
}

// GetUserByUsername fetches a user and their hashed password for login.
func (db *DB) GetUserByUsername(username string) (*User, string, error) {
	u := &User{}
	var hash string
	err := db.QueryRow(
		`SELECT id, username, email, password, created_at FROM users WHERE username = ?`, username,
	).Scan(&u.ID, &u.Username, &u.Email, &hash, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, "", ErrNotFound
	}
	if err != nil {
		return nil, "", fmt.Errorf("get user by username: %w", err)
	}
	return u, hash, nil
}

// ListUsers returns all users (without passwords).
func (db *DB) ListUsers() ([]User, error) {
	rows, err := db.Query(`SELECT id, username, email, created_at FROM users ORDER BY username`)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
