package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

var ErrMissingGeminiKey = errors.New("missing Gemini API key")

// ChatMessage represents one turn in the conversation history.
type ChatMessage struct {
	Role    string
	Content string
}

// Client calls Gemini via the public REST API.
type Client struct {
	apiKey     string
	modelName  string
	fallbacks  []string
	httpClient *http.Client
}

// NewClient initializes a REST client for Gemini.
func NewClient(ctx context.Context, apiKey, modelName string) (*Client, error) {
	fallbacks := []string{
		modelName,
		"gemini-2.5-flash-lite",
		"gemini-2.5-flash",
	}
	seen := make(map[string]bool)
	unique := make([]string, 0, len(fallbacks))
	for _, m := range fallbacks {
		if m == "" || seen[m] {
			continue
		}
		seen[m] = true
		unique = append(unique, m)
	}

	return &Client{
		apiKey:    apiKey,
		modelName: modelName,
		fallbacks: unique,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}, nil
}

// GenerateCalML sends system prompt + full conversation history to Gemini.
func (c *Client) GenerateCalML(ctx context.Context, history []ChatMessage) (string, error) {
	if c.apiKey == "" {
		return "", ErrMissingGeminiKey
	}

	contents := buildGeminiContents(history)

	var lastErr error
	sys := systemInstructionWithContext(history)
	for _, model := range c.fallbacks {
		text, err := c.generateWithModel(ctx, model, sys, contents)
		if err == nil && strings.TrimSpace(text) != "" {
			return text, nil
		}
		lastErr = err
		if err != nil && isRetryableGeminiError(err) {
			continue
		}
		if err != nil {
			return "", err
		}
	}

	if lastErr != nil && isRetryableGeminiError(lastErr) {
		fmt.Println("Gemini unavailable — contextual fallback CalML")
		return contextualFallbackCalML(history), nil
	}
	if lastErr != nil {
		return contextualFallbackCalML(history), nil
	}
	return contextualFallbackCalML(history), nil
}

func isRetryableGeminiError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "429") ||
		strings.Contains(msg, "404") ||
		strings.Contains(msg, "503") ||
		strings.Contains(strings.ToLower(msg), "quota") ||
		strings.Contains(strings.ToLower(msg), "rate")
}

func (c *Client) generateWithModel(ctx context.Context, model, systemText string, contents []map[string]any) (string, error) {
	reqBody := map[string]any{
		"systemInstruction": map[string]any{
			"parts": []map[string]string{
				{"text": systemText},
			},
		},
		"contents": contents,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		model,
		c.apiKey,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini error status %d (model %s): %s", resp.StatusCode, model, string(body))
	}

	var parsed struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &parsed); err != nil {
		return "", err
	}

	if len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini empty candidates (model %s)", model)
	}

	return parsed.Candidates[0].Content.Parts[0].Text, nil
}
