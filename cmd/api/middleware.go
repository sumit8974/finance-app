package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sumit8974/finance-tracker/internal/store"
)

type userKey string
const userCtx userKey = "user"

type transactionKey string
const transactionCtx transactionKey = "transaction"

func (app *application) AuthTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			app.unauthorizedErrorResponse(w, r, errors.New("missing auth token"))
			return
		}
		parts := strings.Split(token, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			app.unauthorizedErrorResponse(w, r, errors.New("invalid auth token format"))
			return
		}
		token = parts[1]
		jwtToken, err := app.authenticator.ValidateToken(token)
		if err != nil {
			app.unauthorizedErrorResponse(w, r, err)
			return
		}

		claims, ok := jwtToken.Claims.(jwt.MapClaims)
		if !ok {
			app.unauthorizedErrorResponse(w, r, errors.New("invalid auth token"))
			return
		}

		userID, err := strconv.ParseInt(fmt.Sprintf("%.f", claims["sub"]), 10, 64)
		if err != nil {
			app.unauthorizedErrorResponse(w, r, errors.New("invalid user ID in token"))
			return
		}
		ctx := r.Context()
		user, err := app.store.Users.GetByID(ctx, userID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				app.unauthorizedErrorResponse(w, r, errors.New("user not found"))
				return
			}
			app.internalServerError(w, r, err)
			return
		}
		ctx = context.WithValue(r.Context(), userCtx, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (app *application) checkTransactionOwnership(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		transaction := getTransactionFromContext(r)
		user := getUserFromContext(r)
		if transaction.UserID != user.ID {
			app.unauthorizedErrorResponse(w, r, errors.New("user does not own this transaction"))
			return
		}
		ctx := context.WithValue(r.Context(), userCtx, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (app *application) rateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if app.config.rateLimiter.Enabled {
			if allow, retry := app.rateLimiter.Allow(r.RemoteAddr); !allow {
				app.rateLimitExceededResponse(w, r, retry.String())
				return
			}
		}
		// Implement rate limiting logic here
		next.ServeHTTP(w, r)
	})
}