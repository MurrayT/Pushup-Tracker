package db

import (
	"errors"
	"strings"
)

// isUniqueErr returns true when err is a SQLite UNIQUE constraint violation.
func isUniqueErr(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "UNIQUE constraint failed")
}

// ErrNotFound is returned when a record does not exist.
var ErrNotFound = errors.New("not found")

// ErrDuplicate is returned on unique constraint violations.
var ErrDuplicate = errors.New("already exists")
