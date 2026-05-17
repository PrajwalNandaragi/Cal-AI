package server

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"calai/internal/ai"
	"calai/internal/config"
	"calai/internal/security"
	"calai/internal/session"
)

type Server struct {
	cfg   *config.Config
	store *session.Store
	ai    *ai.Client
}

func NewServer(cfg *config.Config, store *session.Store, aiClient *ai.Client) *Server {
	return &Server{
		cfg:   cfg,
		store: store,
		ai:    aiClient,
	}
}

func (s *Server) Router() http.Handler {
	r := gin.Default()
	r.Use(corsMiddleware())
	r.Use(SessionAuthMiddleware())

	r.POST("/session/start", s.handleStart)
	r.POST("/session/message", s.handleMessage)
	r.GET("/session/:id/plan", s.handleGetPlan)
	r.DELETE("/session/:id", s.handleDeleteSession)

	return r
}

// POST /session/start
func (s *Server) handleStart(c *gin.Context) {
	sess := s.store.Create()

	// First turn: empty history, Gemini generates first question
	ctx, cancel := context.WithTimeout(c.Request.Context(), 12*time.Second)
	defer cancel()

	calml, err := s.ai.GenerateCalML(ctx, []ai.ChatMessage{})
	if err != nil {
		fmt.Println("GenerateCalML error on /session/start:", err)
		if errors.Is(err, ai.ErrMissingGeminiKey) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "missing_api_key"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ai_error"})
		return
	}

	calml, err = ai.ValidateCalML(calml)
	if err != nil {
		fmt.Println("ValidateCalML error on /session/start:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid_ai_output"})
		return
	}
	calml = ai.RepairAssessmentCalML(calml)
	if err := ai.ValidateAssessmentCalML(calml); err != nil {
		fmt.Println("ValidateAssessmentCalML error on /session/start:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid_ai_output"})
		return
	}

	fmt.Println("CalML from /session/start:", calml)

	sess.History = append(sess.History, session.Message{
		Role:    "assistant",
		Content: calml,
	})

	c.JSON(http.StatusOK, gin.H{
		"sessionId": sess.ID,
		"calml":     calml,
	})
}

type messageReq struct {
	Message string `json:"message"`
}

// POST /session/message
func (s *Server) handleMessage(c *gin.Context) {
	sessID, _ := c.Get("sessionID")
	id := sessID.(string)
	if !s.checkRateLimit(c, id) {
		return
	}

	sess, err := s.store.Get(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session_not_found"})
		return
	}
	if sess.Done {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_done"})
		return
	}

	var req messageReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_body"})
		return
	}

	sanitized, err := security.SanitizeUserInput(req.Message)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_input"})
		return
	}

	sess.History = append(sess.History, session.Message{
		Role:    "user",
		Content: sanitized,
	})
	sess.UserAnswers = append(sess.UserAnswers, sanitized)
	sess.QuestionCount++

	// Build AI history (full thread: every user answer + every assistant CalML turn)
	var hist []ai.ChatMessage
	for _, m := range sess.History {
		hist = append(hist, ai.ChatMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}
	fmt.Printf("Session %s — user answers: %v\n", id, sess.UserAnswers)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	calml, err := s.ai.GenerateCalML(ctx, hist)
	if err != nil {
		fmt.Println("GenerateCalML error on /session/message:", err)
		if errors.Is(err, ai.ErrMissingGeminiKey) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "missing_api_key"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ai_error"})
		return
	}

	calml, err = ai.ValidateCalML(calml)
	if err != nil {
		fmt.Println("ValidateCalML error (first) on /session/message:", err)
		calmlRetry, errRetry := s.ai.GenerateCalML(ctx, hist)
		if errRetry != nil {
			fmt.Println("GenerateCalML retry error on /session/message:", errRetry)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ai_error"})
			return
		}
		calml = calmlRetry
		calml, err = ai.ValidateCalML(calml)
		if err != nil {
			fmt.Println("ValidateCalML error (second) on /session/message:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid_ai_output"})
			return
		}
	}
	calml = ai.RepairAssessmentCalML(calml)
	if err := ai.ValidateAssessmentCalML(calml); err != nil {
		fmt.Println("ValidateAssessmentCalML on /session/message:", err, "| raw:", calml)
	}
	fmt.Println("CalML from /session/message:", calml)

	sess.History = append(sess.History, session.Message{
		Role:    "assistant",
		Content: calml,
	})

	if containsDone(calml) {
		sess.Done = true
		sess.Phase = "plan"
		sess.PlanCalML = calml
	}

	c.JSON(http.StatusOK, gin.H{
		"calml": calml,
		"done":  sess.Done,
	})
}

func containsDone(raw string) bool {
	return strings.Contains(raw, "<done") || strings.Contains(raw, "<done />")
}

// GET /session/:id/plan
func (s *Server) handleGetPlan(c *gin.Context) {
	id := c.Param("id")
	if !s.checkRateLimit(c, id) {
		return
	}

	sess, err := s.store.Get(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session_not_found"})
		return
	}
	if !sess.Done {
		c.JSON(http.StatusBadRequest, gin.H{"error": "plan_not_ready"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"planCalml": sess.PlanCalML,
	})
}

// DELETE /session/:id
func (s *Server) handleDeleteSession(c *gin.Context) {
	id := c.Param("id")
	if !s.checkRateLimit(c, id) {
		return
	}

	s.store.Delete(id)
	c.Status(http.StatusNoContent)
}

func (s *Server) checkRateLimit(c *gin.Context, id string) bool {
	allowed, err := s.store.AllowRequest(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session_not_found"})
		return false
	}
	if !allowed {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate_limit_exceeded"})
		return false
	}
	return true
}
