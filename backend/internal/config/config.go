package config

import (
	"log"
	"os"
)

type Config struct {
	Port          string
	GeminiAPIKey  string
	GeminiModel   string
	RateLimitRPS  int
	SessionSecret string
}

func Load() *Config {
	c := &Config{
		Port:          getEnv("PORT", "8080"),
		GeminiAPIKey:  getEnv("GEMINI_API_KEY", ""),
		GeminiModel:   getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
		RateLimitRPS:  3,
		SessionSecret: getEnv("SESSION_SECRET", "dev-secret"),
	}
	return c
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("missing required env: %s", k)
	}
	return v
}
