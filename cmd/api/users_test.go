package main

import (
	"net/http"
	"testing"

	"github.com/sumit8974/finance-tracker/internal/store"
)

func TestGetUser(t *testing.T) {
	cfg := config{}

	app := newTestApplication(t, cfg)
	mux := app.mount()

	testToken, err := app.authenticator.GenerateToken(nil)
	if err != nil {
		t.Fatal(err)
	}

	t.Run("should not allow unauthenticated requests", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, "/api/v1/users/token", nil)
		if err != nil {
			t.Fatal(err)
		}

		rr := executeRequest(req, mux)

		checkResponseCode(t, http.StatusUnauthorized, rr.Code)
	})

	t.Run("should allow authenticated requests", func(t *testing.T) {
		mockStore := app.store.Users.(*store.MockUserStore)

		mockStore.On("GetByID", int64(1)).Return(nil, nil).Twice()

		req, err := http.NewRequest(http.MethodGet, "/api/v1/users/token", nil)
		if err != nil {
			t.Fatal(err)
		}

		req.Header.Set("Authorization", "Bearer "+testToken)

		rr := executeRequest(req, mux)

		checkResponseCode(t, http.StatusOK, rr.Code)

		mockStore.Calls = nil // Reset mock expectations
	})
}
