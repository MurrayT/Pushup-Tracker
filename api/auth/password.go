package auth

import (
	"golang.org/x/crypto/bcrypt"
)

const saltLen = 16

// HashPassword returns a salt$hash string using SHA-256.
// NOTE: For production, replace this with golang.org/x/crypto/bcrypt.
func HashPassword(plain string) (string, error) {
	hash, _ := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(hash), nil
}

// CheckPassword verifies a plain-text password against a stored hash.
func CheckPassword(plain, stored string) error {
	return bcrypt.CompareHashAndPassword([]byte(stored), []byte(plain))
}
