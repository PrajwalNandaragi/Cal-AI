package session

import "time"

type Message struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // user answer text or assistant CalML
}

type Session struct {
	ID            string    `json:"id"`
	CreatedAt     time.Time `json:"createdAt"`
	History       []Message `json:"history"`
	UserAnswers   []string  `json:"userAnswers"` // plain-text answers in order, for AI context
	Phase         string    `json:"phase"`       // "assessment" | "plan"
	QuestionCount int       `json:"questionCount"`
	Done          bool      `json:"done"`
	PlanCalML     string    `json:"planCalml,omitempty"`
	RequestCount  int       `json:"-"`
	WindowStart   time.Time `json:"-"`
}
