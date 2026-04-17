package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
)

const saltLen = 16

// HashPassword returns a salt$hash string using SHA-256.
// NOTE: For production, replace this with golang.org/x/crypto/bcrypt.
func HashPassword(plain string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generate salt: %w", err)
	}
	saltHex := hex.EncodeToString(salt)
	h := sha256.Sum256([]byte(saltHex + plain))
	return saltHex + "$" + hex.EncodeToString(h[:]), nil
}

// CheckPassword verifies a plain-text password against a stored hash.
func CheckPassword(plain, stored string) error {
	parts := strings.SplitN(stored, "$", 2)
	if len(parts) != 2 {
		return errors.New("invalid stored hash format")
	}
	saltHex, hashHex := parts[0], parts[1]
	h := sha256.Sum256([]byte(saltHex + plain))
	if hex.EncodeToString(h[:]) != hashHex {
		return errors.New("password mismatch")
	}
	return nil
}
