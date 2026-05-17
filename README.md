# CalAI

CalAI is a simple assessment app with a Go backend and an Expo React Native frontend.

## Overview

- `backend/` runs a small HTTP server that manages user sessions and communicates with the AI.
- `frontend/` is a mobile/web client that renders the AI’s CalML responses and collects user answers.

## How it works

1. The app starts on the frontend.
2. The frontend calls `POST /session/start` to create a new session.
3. The backend uses the AI client to generate the first question in CalML format.
4. The frontend parses CalML and renders the question with controls such as multiple-choice, yes/no, slider, or text input.
5. When the user answers, the frontend sends the answer to `POST /session/message`.
6. The backend stores the history, sends it to the AI again, validates and repairs CalML, then returns the next response.
7. When the AI returns `<done/>`, the app transitions to the plan screen and shows the generated training plan.

## Backend details

- Built with Go and Gin.
- Uses environment variables for configuration.
- Validates AI output to allow only approved CalML tags.
- Repairs common output issues so the client can render questions reliably.

### Backend config

Create `backend/.env` with values such as:

```env
GEMINI_API_KEY=your_api_key_here
PORT=8080
SESSION_SECRET=your_secret
GEMINI_MODEL=gemini-2.5-flash
