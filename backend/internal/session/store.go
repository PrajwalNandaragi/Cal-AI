package session

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Store struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

func NewStore() *Store {
	return &Store{
		sessions: make(map[string]*Session),
	}
}

func (s *Store) Create() *Session {
	id := uuid.NewString()
	sess := &Session{
		ID:        id,
		CreatedAt: time.Now(),
		Phase:     "assessment",
		History:   []Message{},
	}
	s.mu.Lock()
	s.sessions[id] = sess
	s.mu.Unlock()
	return sess
}

func (s *Store) Get(id string) (*Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sess, ok := s.sessions[id]
	if !ok {
		return nil, errors.New("session not found")
	}
	return sess, nil
}

func (s *Store) AllowRequest(id string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sess, ok := s.sessions[id]
	if !ok {
		return false, errors.New("session not found")
	}

	if sess.WindowStart.IsZero() || time.Since(sess.WindowStart) >= time.Hour {
		sess.WindowStart = time.Now()
		sess.RequestCount = 0
	}
	if sess.RequestCount >= 60 {
		return false, nil
	}

	sess.RequestCount++
	return true, nil
}

func (s *Store) Delete(id string) {
	s.mu.Lock()
	delete(s.sessions, id)
	s.mu.Unlock()
}
