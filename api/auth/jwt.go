package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"
)

var jwtSecret []byte

func init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Generate a random secret at startup (not persistent across restarts – fine for dev).
		b := make([]byte, 32)
		if _, err := rand.Read(b); err != nil {
			panic("failed to generate JWT secret")
		}
		jwtSecret = b
	} else {
		jwtSecret = []byte(secret)
	}
}

type jwtHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

// Claims is the JWT payload.
type Claims struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Exp      int64  `json:"exp"`
}

const tokenTTL = 24 * time.Hour

// GenerateToken creates a signed HS256 JWT for the given user.
func GenerateToken(userID int64, username string) (string, error) {
	hdr, _ := json.Marshal(jwtHeader{Alg: "HS256", Typ: "JWT"})
	payload, _ := json.Marshal(Claims{
		UserID:   userID,
		Username: username,
		Exp:      time.Now().Add(tokenTTL).Unix(),
	})

	hdrB64 := base64.RawURLEncoding.EncodeToString(hdr)
	payB64 := base64.RawURLEncoding.EncodeToString(payload)

	sigInput := hdrB64 + "." + payB64
	sig := sign(sigInput)

	return sigInput + "." + sig, nil
}

// ValidateToken parses and verifies a JWT, returning its claims.
func ValidateToken(token string) (*Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed token")
	}

	sigInput := parts[0] + "." + parts[1]
	expected := sign(sigInput)
	if !hmac.Equal([]byte(expected), []byte(parts[2])) {
		return nil, errors.New("invalid signature")
	}

	payBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("decode payload: %w", err)
	}

	var c Claims
	if err := json.Unmarshal(payBytes, &c); err != nil {
		return nil, fmt.Errorf("parse claims: %w", err)
	}

	if time.Now().Unix() > c.Exp {
		return nil, errors.New("token expired")
	}

	return &c, nil
}

func sign(input string) string {
	mac := hmac.New(sha256.New, jwtSecret)
	mac.Write([]byte(input))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
