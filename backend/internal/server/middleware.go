package server

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func SessionAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow starting a session without header
		if strings.HasPrefix(c.FullPath(), "/session/start") {
			c.Next()
			return
		}

		token := strings.TrimSpace(c.GetHeader("X-Session-Id"))
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing session id"})
			return
		}
		c.Set("sessionID", token)
		c.Next()
	}
}
