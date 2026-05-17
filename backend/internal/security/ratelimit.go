package security

import (
    "net/http"
    "sync"
    "time"
)

type tokenBucket struct {
    tokens int
    last   time.Time
}

type RateLimiter struct {
    mu       sync.Mutex
    limit    int
    interval time.Duration
    buckets  map[string]*tokenBucket
}

func NewRateLimiter(rps int) *RateLimiter {
    return &RateLimiter{
        limit:    rps,
        interval: time.Second,
        buckets:  make(map[string]*tokenBucket),
    }
}

func (rl *RateLimiter) Allow(key string) bool {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    b, ok := rl.buckets[key]
    now := time.Now()
    if !ok {
        rl.buckets[key] = &tokenBucket{tokens: rl.limit - 1, last: now}
        return true
    }
    elapsed := now.Sub(b.last)
    if elapsed > rl.interval {
        b.tokens = rl.limit - 1
        b.last = now
        return true
    }
    if b.tokens <= 0 {
        return false
    }
    b.tokens--
    return true
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ip := r.RemoteAddr
        if !rl.Allow(ip) {
            http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
            return
        }
        next.ServeHTTP(w, r)
    })
}