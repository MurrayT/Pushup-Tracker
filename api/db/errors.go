package db

import "strings"

// isUniqueErr returns true when err is a SQLite UNIQUE constraint violation.
func isUniqueErr(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "UNIQUE constraint failed")
}
