package security

import (
    "regexp"
    "strings"
)

var htmlTag = regexp.MustCompile(`(?i)<[^>]+>`)
var promptInject = regexp.MustCompile(`(?i)(ignore previous instructions|system prompt|you are chatgpt|override)`)

func SanitizeUserInput(in string) (string, error) {
    if len(in) > 500 {
        in = in[:500]
    }
    cleaned := htmlTag.ReplaceAllString(in, "")
    cleaned = strings.TrimSpace(cleaned)
    if promptInject.MatchString(cleaned) {
        return "", ErrPromptInjection
    }
    return cleaned, nil
}