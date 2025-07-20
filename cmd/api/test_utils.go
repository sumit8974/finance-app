package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/sumit8974/finance-tracker/internal/auth"
	"github.com/sumit8974/finance-tracker/internal/ratelimiter"
	"github.com/sumit8974/finance-tracker/internal/store"
	"go.uber.org/zap"
)

func newTestApplication(t *testing.T, cfg config) *application {
	t.Helper()

	logger := zap.NewNop().Sugar()
	// Uncomment to enable logs
	// logger := zap.Must(zap.NewProduction()).Sugar()
	mockStore := store.NewMockStore()

	testAuth := &auth.TestAuthenticator{}

	// Rate limiter
	rateLimiter := ratelimiter.NewFixedWindowRateLimiter(
		cfg.rateLimiter.RequestsPerTimeFrame,
		cfg.rateLimiter.TimeFrame,
	)

	return &application{
		logger:        logger,
		store:         mockStore,
		authenticator: testAuth,
		config:        cfg,
		rateLimiter:   rateLimiter,
	}
}

func executeRequest(req *http.Request, mux http.Handler) *httptest.ResponseRecorder {
	fmt.Println("REQ", req.URL)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	return rr
}

func checkResponseCode(t *testing.T, expected, actual int) {
	if expected != actual {
		t.Errorf("Expected response code %d. Got %d", expected, actual)
	}
}