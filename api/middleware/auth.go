package middleware

import (
	"context"
	"net/http"
	"pushup-tracker/auth"
)

type contextKey string

const UserIDKey contextKey = "userID"

// Auth validates the Bearer JWT and injects the user ID into the request context.
func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		} else {
			http.Error(w, `{"error":"missing or malformed Authorization header"}`, http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateToken(token)
		if err != nil {
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		next(w, r.WithContext(ctx))
	}
}

// UserIDFromContext extracts the authenticated user ID from the context.
func UserIDFromContext(ctx context.Context) (int64, bool) {
	id, ok := ctx.Value(UserIDKey).(int64)
	return id, ok
}
