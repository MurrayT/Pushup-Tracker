package main

import (
	"log"
	"net/http"
	"os"
	"pushup-tracker/db"
	"pushup-tracker/handlers"
	"pushup-tracker/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize database
	database, err := db.Initialize("pushups.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Set up router
	mux := http.NewServeMux()

	h := handlers.New(database)

	// Auth routes (no auth required)
	mux.HandleFunc("POST /api/auth/register", h.Register)
	mux.HandleFunc("POST /api/auth/login", h.Login)

	// Pushup routes (auth required)
	mux.HandleFunc("POST /api/pushups", middleware.Auth(h.AddPushups))
	mux.HandleFunc("GET /api/pushups", middleware.Auth(h.GetPushups))
	mux.HandleFunc("GET /api/pushups/{user_id}", middleware.Auth(h.GetPushupsForUser))

	// Users route
	mux.HandleFunc("GET /api/users", middleware.Auth(h.ListUsers))

	log.Printf("Server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
