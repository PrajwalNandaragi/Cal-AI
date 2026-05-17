package ai

import (
	"fmt"
	"regexp"
	"strings"
)

var questionTag = regexp.MustCompile(`(?i)<question>([\s\S]*?)</question>`)

// SummarizeUserAnswers builds a clear block the model must use for follow-up questions.
func SummarizeUserAnswers(history []ChatMessage) string {
	var answers []string
	turn := 0
	for _, m := range history {
		if m.Role != "user" {
			continue
		}
		turn++
		text := strings.TrimSpace(m.Content)
		if text == "" {
			continue
		}
		answers = append(answers, fmt.Sprintf("%d. %s", turn, text))
	}
	if len(answers) == 0 {
		return "No user answers yet."
	}
	return strings.Join(answers, "\n")
}

// LastUserAnswer returns the most recent user message.
func LastUserAnswer(history []ChatMessage) string {
	for i := len(history) - 1; i >= 0; i-- {
		if history[i].Role == "user" {
			return strings.TrimSpace(history[i].Content)
		}
	}
	return ""
}

// ExtractQuestionFromCalML pulls the question text from assistant CalML.
func ExtractQuestionFromCalML(calml string) string {
	m := questionTag.FindStringSubmatch(calml)
	if len(m) > 1 {
		return strings.TrimSpace(m[1])
	}
	return ""
}

func systemInstructionWithContext(history []ChatMessage) string {
	if len(history) == 0 {
		return SystemPrompt
	}
	return SystemPrompt + `

--- USER ANSWERS SO FAR (read carefully; your next question must follow from these) ---
` + SummarizeUserAnswers(history) + `

--- END USER ANSWERS ---
Your next <question> must relate to their latest answer and must not ignore what they already told you.`
}

func buildGeminiContents(history []ChatMessage) []map[string]any {
	if len(history) == 0 {
		return []map[string]any{
			{
				"role": "user",
				"parts": []map[string]string{
					{"text": "Start the calisthenics assessment. Greet the user briefly and ask your first question in CalML only."},
				},
			},
		}
	}

	contents := make([]map[string]any, 0, len(history))
	for _, m := range history {
		role := "user"
		text := m.Content
		if m.Role == "assistant" {
			role = "model"
			if q := ExtractQuestionFromCalML(m.Content); q != "" {
				text = "CalML response. Question asked: " + q
			}
		}
		contents = append(contents, map[string]any{
			"role": role,
			"parts": []map[string]string{
				{"text": text},
			},
		})
	}
	return contents
}
