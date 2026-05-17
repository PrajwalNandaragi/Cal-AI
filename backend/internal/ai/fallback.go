package ai

import "fmt"

// contextualFallbackCalML asks the next generic-but-personalized question using prior answers.
func contextualFallbackCalML(history []ChatMessage) string {
	last := LastUserAnswer(history)
	userTurns := 0
	for _, m := range history {
		if m.Role == "user" {
			userTurns++
		}
	}

	progress := 10 + userTurns*12
	if progress > 90 {
		progress = 90
	}

	ref := ""
	if last != "" {
		ref = fmt.Sprintf("You said: \"%s\". ", last)
	}

	switch userTurns {
	case 0:
		return fmt.Sprintf(`<progress>%d</progress>
<question>Welcome! What is your primary calisthenics goal?</question>
<mc1>
<option value="strength">Build strength</option>
<option value="skills">Learn skills (handstand, muscle-up)</option>
<option value="muscle">Build muscle</option>
<option value="health">General fitness</option>
</mc1>`, progress)
	case 1:
		return fmt.Sprintf(`<progress>%d</progress>
<text>%sGreat choice.</text>
<question>How many days per week can you realistically train for that goal?</question>
<mc1>
<option value="2">1-2 days</option>
<option value="3">3 days</option>
<option value="4">4 days</option>
<option value="5">5+ days</option>
</mc1>`, progress, ref)
	case 2:
		return fmt.Sprintf(`<progress>%d</progress>
<text>%s</text>
<question>What equipment do you have access to for your training?</question>
<mcn>
<option value="pullup">Pull-up bar</option>
<option value="rings">Gymnastic rings</option>
<option value="dips">Dip station / parallel bars</option>
<option value="weights">Weights</option>
<option value="none">Bodyweight only</option>
</mcn>`, progress, ref)
	case 3:
		return fmt.Sprintf(`<progress>%d</progress>
<text>%s</text>
<question>Any injuries, pain, or limitations I should plan around?</question>
<yesno />`, progress, ref)
	default:
		return `<progress>100</progress>
<text>Based on everything you shared, here is a starter plan.</text>
<done />
<plan>
<section>
<text>Foundation phase (4 weeks)</text>
<exercise><text>Push-ups — 3 sets of 8-12, rest 90s</text></exercise>
<exercise><text>Rows — 3 sets of 8-12, rest 90s</text></exercise>
<exercise><text>Squats — 3 sets of 15-20, rest 60s</text></exercise>
<exercise><text>Plank — 3 sets of 30-45s</text></exercise>
<tip>Train 3x/week with at least one rest day between sessions.</tip>
</section>
</plan>`
	}
}
