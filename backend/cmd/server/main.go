package main

import (
	"context"
	"log"
	"net/http"

	"github.com/joho/godotenv"

	"calai/internal/ai"
	"calai/internal/config"
	"calai/internal/server"
	"calai/internal/session"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	ctx := context.Background()

	if cfg.GeminiAPIKey == "" {
		log.Println("WARNING: GEMINI_API_KEY is not set. AI endpoints will return a controlled error until the key is configured.")
	}

	aiClient, err := ai.NewClient(ctx, cfg.GeminiAPIKey, cfg.GeminiModel)
	if err != nil {
		log.Fatalf("failed to init gemini: %v", err)
	}

	store := session.NewStore()
	srv := server.NewServer(cfg, store, aiClient)
	router := srv.Router()

	log.Printf("Listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, router))
}
