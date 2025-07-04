package main

import (
	"time"

	"github.com/joho/godotenv"
	"github.com/sumit8974/finance-tracker/cmd/migrate/db"
	"github.com/sumit8974/finance-tracker/internal/auth"
	"github.com/sumit8974/finance-tracker/internal/env"
	"github.com/sumit8974/finance-tracker/internal/mail"
	"github.com/sumit8974/finance-tracker/internal/ratelimiter"
	"github.com/sumit8974/finance-tracker/internal/store"
	"go.uber.org/zap"
)

const version = "1.1.0"

//	@title			FinTracker API
//	@description	API for a finance tracker application
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	API Support
//	@contact.url	http://www.swagger.io/support
//	@contact.email	support@swagger.io

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

// @BasePath					/v1
//
// @securityDefinitions.apikey	ApiKeyAuth
// @in							header
// @name						Authorization
// @description
func main() {
	// Logger
	logger := zap.Must(zap.NewProduction()).Sugar()
	defer logger.Sync()

	// Load .env file
	err := godotenv.Load()
	if err != nil {
		logger.Error("No .env file found, proceeding with default env vars")
	}
	cfg := config{
		addr:        env.GetString("ADDR", ":8000"),
		apiURL:      env.GetString("EXTERNAL_URL", "localhost:8000"),
		frontendURL: env.GetString("FRONTEND_URL", "http://localhost:8081"),
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", "postgres://postgres:postgres@localhost/finance-app?sslmode=disable"),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleConns: env.GetInt("DB_MAX_IDLE_CONNS", 30),
			maxIdleTime:  env.GetString("DB_MAX_IDLE_TIME", "15m"),
		},
		// 	redisCfg: redisConfig{
		// 		addr:    env.GetString("REDIS_ADDR", "localhost:6379"),
		// 		pw:      env.GetString("REDIS_PW", ""),
		// 		db:      env.GetInt("REDIS_DB", 0),
		// 		enabled: env.GetBool("REDIS_ENABLED", false),
		// 	},
		env: env.GetString("ENV", "development"),
		mail: mailConfig{
			exp:       time.Hour * 24 * 3, // 3 days
			fromEmail: env.GetString("FROM_EMAIL", ""),
			maxResetPasswordRequests: env.GetInt("MAX_RESET_PASSWORD_REQUESTS", 3),
			sendGrid: sendGridConfig{
				apiKey: env.GetString("SENDGRID_API_KEY", ""),
			},
			mailTrap: mailTrapConfig{
				apiKey:  env.GetString("MAILTRAP_API_KEY", ""),
				appPass: env.GetString("GMAIL_APP_PASS", ""),
			},
		},
		auth: authConfig{
			basic: basicConfig{
				user: env.GetString("AUTH_BASIC_USER", "admin"),
				pass: env.GetString("AUTH_BASIC_PASS", "admin"),
			},
			token: tokenConfig{
				secret: env.GetString("AUTH_TOKEN_SECRET", "example"),
				exp:    time.Hour * 24 * 3, // 3 days
				iss:    "finance-tracker",
			},
		},
		rateLimiter: ratelimiter.RateLimiterConfig{
			RequestsPerTimeFrame: env.GetInt("RATELIMITER_REQUESTS_COUNT", 10),
			TimeFrame:            time.Second * 5,
			Enabled:              env.GetBool("RATE_LIMITER_ENABLED", true),
		},
	}

	// Main Database
	db, err := db.New(
		cfg.db.addr,
		cfg.db.maxOpenConns,
		cfg.db.maxIdleConns,
		cfg.db.maxIdleTime,
	)
	if err != nil {
		logger.Fatal(err)
	}

	defer db.Close()
	logger.Info("database connection pool established")
	// Authenticator
	jwtAuthenticator := auth.NewJWTAuthenticator(
		cfg.auth.token.secret,
		cfg.auth.token.iss,
		cfg.auth.token.iss,
	)

	store := store.NewStorage(db)
	rateLimiter := ratelimiter.NewFixedWindowRateLimiter(
		cfg.rateLimiter.RequestsPerTimeFrame,
		cfg.rateLimiter.TimeFrame,
	)
	// cacheStorage := cache.NewRedisStorage(rdb)
	// sendGrid := mail.NewSendGrid(cfg.mail.sendGrid.apiKey, cfg.mail.fromEmail)
	htmlParser := mail.HtmlParser{
		FileName: mail.UserWelcomeTemplate,
	}
	mailTrap, err := mail.NewMailTrapClient(cfg.mail.mailTrap.apiKey, cfg.mail.fromEmail, cfg.mail.mailTrap.appPass, &htmlParser)
	if err != nil {
		logger.Fatal(err)
	}

	app := &application{
		config: cfg,
		store:  store,
		// cacheStorage:  cacheStorage,
		logger:        logger,
		mailer:        mailTrap,
		authenticator: jwtAuthenticator,
		rateLimiter:   rateLimiter,
	}
	mux := app.mount()

	logger.Fatal(app.run(mux))
}
