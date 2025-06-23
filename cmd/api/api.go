package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/sumit8974/finance-tracker/docs"
	"github.com/sumit8974/finance-tracker/internal/auth"
	"github.com/sumit8974/finance-tracker/internal/env"
	"github.com/sumit8974/finance-tracker/internal/mail"
	"github.com/sumit8974/finance-tracker/internal/ratelimiter"
	"github.com/sumit8974/finance-tracker/internal/store"
	httpSwagger "github.com/swaggo/http-swagger/v2"
	"go.uber.org/zap"
)

type application struct {
	config        config
	store         store.Storage
	authenticator auth.Authenticator
	logger        *zap.SugaredLogger
	mailer        mail.MailerClient
	rateLimiter   ratelimiter.RateLimiter
}

type config struct {
	addr        string
	db          dbConfig
	env         string
	apiURL      string
	frontendURL string
	mail        mailConfig
	auth        authConfig
	rateLimiter ratelimiter.RateLimiterConfig
}

type dbConfig struct {
	addr         string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime  string
}

type sendGridConfig struct {
	apiKey string
}

type mailTrapConfig struct {
	apiKey string
	appPass string
}

type mailConfig struct {
	sendGrid  sendGridConfig
	mailTrap  mailTrapConfig
	fromEmail string
	maxResetPasswordRequests int
	exp       time.Duration
}

type authConfig struct {
	basic basicConfig
	token tokenConfig
}

type tokenConfig struct {
	secret string
	exp    time.Duration
	iss    string
}

type basicConfig struct {
	user string
	pass string
}

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{env.GetString("CORS_ALLOWED_ORIGIN", "http://localhost:8081")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))
	if app.config.rateLimiter.Enabled {
		r.Use(app.rateLimitMiddleware)
	}
	r.Route("/api/v1", func(r chi.Router) {
		// Operations
		r.Get("/health", app.healthCheckHandler)

		docsURL := fmt.Sprintf("%s/swagger/doc.json", app.config.addr)
		fmt.Println("docsURL", app.config.addr)
		r.Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL(docsURL)))

		r.Route("/transactions", func(r chi.Router) {
			r.Use(app.AuthTokenMiddleware)
			r.Post("/", app.createTransactionHandler)
			r.Get("/", app.listTransactionsHandler)
			r.Route("/{id}", func(r chi.Router) {
				r.Use(app.transactionContextMiddleware)
				r.Get("/", app.checkTransactionOwnership(app.getTransactionByIDHandler))
				r.Delete("/", app.checkTransactionOwnership(app.deleteTransactionByIDHandler))
				r.Patch("/", app.checkTransactionOwnership(app.updateTransactionByIDHandler))
			})
		})
		r.Route("/categories", func(r chi.Router) {
			r.Use(app.AuthTokenMiddleware)
			r.Get("/", app.listCategoriesHandler)
			// r.Post("/", app.createCategoryHandler)
		})

		r.Route("/users", func(r chi.Router) {
			r.Put("/activate/{token}", app.activateUserHandler)
			r.Route("/", func(r chi.Router) {
				r.Use(app.AuthTokenMiddleware)
				// 	r.Put("/activate/{token}", app.activateUserHandler)
				r.Get("/token", app.getUserByTokenHandler)

			})
		})

		// Public routes
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", app.registerUserHandler)
			r.Post("/login", app.loginUserHandler)
			r.Get("/validate-invitation-token/{token}", app.validateUserInvitationTokenHandler)
			r.Post("/forgot-password", app.forgotPasswordHandler)
			r.Get("/validate-reset-token/{token}", app.validateResetPasswordTokenHandler)
			r.Put("/reset-password", app.resetPasswordHandler)
		})
	})

	return r
}

func (app *application) run(mux http.Handler) error {
	// Docs
	docs.SwaggerInfo.Version = version
	docs.SwaggerInfo.Host = app.config.apiURL
	docs.SwaggerInfo.BasePath = "/api/v1"

	srv := &http.Server{
		Addr:         app.config.addr,
		Handler:      mux,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}

	shutdown := make(chan error)

	go func() {
		quit := make(chan os.Signal, 1)

		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		app.logger.Infow("signal caught", "signal", s.String())

		shutdown <- srv.Shutdown(ctx)
	}()

	app.logger.Infow("server has started", "addr", app.config.addr, "env", app.config.env)

	err := srv.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	err = <-shutdown
	if err != nil {
		return err
	}

	app.logger.Infow("server has stopped", "addr", app.config.addr, "env", app.config.env)

	return nil
}
