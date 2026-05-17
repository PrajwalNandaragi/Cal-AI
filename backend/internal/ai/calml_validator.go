package ai

import (
	"encoding/xml"
	"errors"
	"regexp"
	"strings"
)

var (
	errMissingQuestion = errors.New("assessment response missing <question>")
	errMissingWidget   = errors.New("assessment response missing input widget")
)

// Tags that CalML is allowed to use.
// "root" is only used as a wrapper for parsing.
var allowedTags = map[string]bool{
	"root":     true,
	"text":     true,
	"question": true,
	"mc1":      true,
	"mcn":      true,
	"scale":    true,
	"input":    true,
	"yesno":    true,
	"section":  true,
	"exercise": true,
	"tip":      true,
	"plan":     true,
	"progress": true,
	"done":     true,
	"option":   true,
}

var scriptLike = regexp.MustCompile(`(?i)<\s*(script|iframe)[^>]*>`)
var piiRegex = regexp.MustCompile(`(?i)(\b\d{10}\b|@|passport|aadhar|aadhaar|ssn|social security)`)

// ValidateCalML checks that the AI output:
// - has no script-like tags
// - has no obvious PII
// - only uses allowed tags
// - has at most one <done /> tag
func ValidateCalML(raw string) (string, error) {
	if scriptLike.MatchString(raw) {
		return "", errors.New("disallowed tag")
	}
	if piiRegex.MatchString(raw) {
		return "", errors.New("possible PII in output")
	}

	// Wrap the fragment so the XML decoder can parse it.
	decoder := xml.NewDecoder(strings.NewReader("<root>" + raw + "</root>"))
	decoder.Strict = false

	doneCount := 0

	for {
		tok, err := decoder.Token()
		if err != nil {
			if err.Error() == "EOF" {
				break
			}
			return "", err
		}

		switch t := tok.(type) {
		case xml.StartElement:
			if !allowedTags[t.Name.Local] {
				return "", errors.New("unapproved tag: " + t.Name.Local)
			}
			if t.Name.Local == "done" {
				doneCount++
				if doneCount > 1 {
					return "", errors.New("<done /> appears more than once")
				}
			}
		}
	}

	return raw, nil
}
