package main

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sumit8974/finance-tracker/internal/mail"
	"github.com/sumit8974/finance-tracker/internal/store"
)

type RegisterUserPayload struct {
	Username string `json:"username" validate:"required,max=100"`
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=6,max=72"`
}

type UserWithToken struct {
	*store.User
	Token string `json:"token"`
}

// registerUserHandler godoc
//
//	@Summary		Register a new user
//	@Description	Register a new user
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		RegisterUserPayload	true	"Register user payload"
//	@Success		201		{object}	UserWithToken
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Router			/auth/register [post]
func (app *application) registerUserHandler(w http.ResponseWriter, r *http.Request) {
	var payload RegisterUserPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.logger.Errorw("failed to read request body", "error", err)
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.logger.Errorw("failed to validate request payload", "error", err)
		app.badRequestResponse(w, r, err)
		return
	}

	user := &store.User{
		Username: payload.Username,
		Email:    payload.Email,
		IsActive: true, // TODO: need to make it false when mail is included
		Role: store.Role{
			Name: "user", // TODO: come back here
		},
	}

	if err := user.Password.Set(payload.Password); err != nil {
		app.logger.Errorw("failed to set password", "error", err)
		app.internalServerError(w, r, err)
		return
	}

	ctx := r.Context()

	plainToken := uuid.New().String()

	// hash the token for storage but keep the plain token for email
	hash := sha256.Sum256([]byte(plainToken))
	hashToken := hex.EncodeToString(hash[:])

	err := app.store.Users.CreateAndInvite(ctx, user, hashToken, app.config.mail.exp)
	if err != nil {
		switch err {
		case store.ErrDuplicateEmail:
			app.badRequestResponse(w, r, err)
		case store.ErrDuplicateUsername:
			app.badRequestResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	userWithToken := &UserWithToken{
		User:  user,
		Token: plainToken,
	}

	activationURL := app.config.frontendURL + "/users/activate/" + plainToken

	isProdEnv := app.config.env == "production"
	vars := struct {
		Username      string
		ActivationURL string
	}{
		Username:      user.Username,
		ActivationURL: activationURL,
	}
	fmt.Println(mail.UserWelcomeTemplate, user.Username, user.Email, vars)

	//send email TODO: comeback here after implementing mailer
	status, err := app.mailer.Send(mail.UserWelcomeTemplate, user.Username, user.Email, vars, !isProdEnv)
	if err != nil {
		app.logger.Errorw("error sending welcome email", "error", err)

		// rollback user creation if email fails (SAGA pattern)
		if err := app.store.Users.Delete(ctx, user.ID); err != nil {
			app.logger.Errorw("error deleting user", "error", err)
		}

		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infow("Email sent", "status code", status)

	if err := app.jsonResponse(w, http.StatusCreated, userWithToken); err != nil {
		app.logger.Errorw("failed to write response", "error", err)
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infow("user registered", "user", user.ID, "email", user.Email)
}

type LoginUserPayload struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=6,max=72"`
}

type LoginUserResponse struct {
	Token string `json:"token"`
}

// loginUserHandler godoc
//
//	@Summary		User login
//	@Description	User login
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		LoginUserPayload	true	"Login user payload"
//	@Success		200		{object}	LoginUserResponse
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Router			/auth/login [post]
func (app *application) loginUserHandler(w http.ResponseWriter, r *http.Request) {
	var payload LoginUserPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.logger.Errorw("failed to read request body", "error", err)
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.logger.Errorw("failed to validate request payload", "error", err)
		app.badRequestResponse(w, r, err)
		return
	}

	user, err := app.store.Users.GetByEmail(r.Context(), payload.Email)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := user.Password.Compare(payload.Password); err != nil {
		app.logger.Errorw("failed to compare password", "error", err)
		app.badRequestResponse(w, r, errors.New("error invalid password or email"))
		return
	}

	claims := jwt.MapClaims{
		"sub":  user.ID,
		"iss":  app.config.auth.token.iss,
		"aud":  app.config.auth.token.iss,
		"exp":  time.Now().Add(app.config.auth.token.exp).Unix(),
		"iat":  time.Now().Unix(),
		"role": user.Role.Name,
		"nbf":  time.Now().Unix(),
	}

	token, err := app.authenticator.GenerateToken(claims)
	if err != nil {
		app.logger.Errorw("failed to generate token", "error", err)
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, LoginUserResponse{Token: token}); err != nil {
		app.logger.Errorw("failed to write response", "error", err)
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infow("user logged in", "user", user.ID, "email", user.Email)
}

// valudateUserInvitationTokenHandler godoc
//
//	@Summary		Validate user invitation token
//	@Description	Validate user invitation token
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			token	path		string	true	"User invitation token"
//	@Success		200		{string}	string	"valid token"
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Router			/auth/validate-invitation-token/{token} [get]
func (app *application) validateUserInvitationTokenHandler(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		app.badRequestResponse(w, r, errors.New("token is required"))
	}
	valid, err := app.store.Token.Validate(token)
	if err != nil {
		app.logger.Errorw("failed to validate token", "error", err)
		app.internalServerError(w, r, err)
		return
	}
	if !valid {
		app.logger.Errorw("invalid token", "token", token)
		app.badRequestResponse(w, r, errors.New("invalid token"))
		return
	}
	app.logger.Infow("token is valid", "token", token)
	if err := app.jsonResponse(w, http.StatusOK, "valid token"); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

type ForgotPasswordPayload struct {
	Email string `json:"email" validate:"required,email,max=255"`
}

type ForgotPasswordResponse struct {
	Token string `json:"token"`
}

// forgotPasswordHandler godoc
//
//	@Summary		Forgot password
//	@Description	Forgot password
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		ForgotPasswordPayload	true	"Forgot password payload"
//	@Success		200		{object}	ForgotPasswordResponse
//	@Failure		400		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Router			/auth/forgot-password [post]
func (app *application) forgotPasswordHandler(w http.ResponseWriter, r *http.Request) {
	var payload ForgotPasswordPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.logger.Errorw("failed to read request body", "error", err)
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.logger.Errorw("failed to validate request payload", "error", err)
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()
	user, err := app.store.Users.GetByEmail(ctx, payload.Email)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, errors.New("user not found or is inactive"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	resetCount, err := app.store.Users.GetUserResetPasswordTokenCount(ctx, user.ID)
	if err != nil {
		app.logger.Errorw("failed to count password reset tokens", "error", err)
		app.internalServerError(w, r, err)
		return
	}
	if resetCount >= int64(app.config.mail.maxResetPasswordRequests) {
		app.logger.Errorw("maximum password reset requests reached", "email", user.Email)
		app.badRequestResponse(w, r, errors.New("maximum password reset requests reached please try again later"))
		return
	}

	plainToken := uuid.New().String()
	hash := sha256.Sum256([]byte(plainToken))
	hashToken := hex.EncodeToString(hash[:])
	if err := app.store.Users.CreateUserResetPasswordToken(ctx, user.ID, hashToken, time.Duration(15)*time.Minute); err != nil {
		app.logger.Errorw("failed to create password reset request", "error", err)
		app.internalServerError(w, r, err)
		return
	}

	resetUrl := app.config.frontendURL + "/reset-password/" + plainToken
	isProdEnv := app.config.env == "production"
	vars := struct {
		Username string
		ResetURL string
	}{
		Username: user.Username,
		ResetURL: resetUrl,
	}
	status, err := app.mailer.Send(mail.PasswordResetTemplate, user.Username, user.Email, vars, !isProdEnv)
	if err != nil {
		app.logger.Errorw("error sending password reset email", "error", err)

		// rollback user creation if email fails (SAGA pattern)
		if err := app.store.Users.DeleteUserResetPasswordToken(ctx, hashToken); err != nil {
			app.logger.Errorw("error deleting password reset token", "error", err)
		}

		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infow("Email sent", "status code", status)
	userReset := ForgotPasswordResponse{
		Token: plainToken,
	}
	if err := app.jsonResponse(w, http.StatusOK, userReset); err != nil {
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infow("password reset email sent", "email", user.Email)
}

// validateResetPasswordTokenHandler godoc
//
//	@Summary		Validate reset password token
//	@Description	Validate reset password token
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			token	path		string	true	"Reset password token"
//	@Success		200		{string}	string	"valid token"
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Router			/auth/validate-reset-token/{token} [get]
func (app *application) validateResetPasswordTokenHandler(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		app.badRequestResponse(w, r, errors.New("token is required"))
		return
	}

	valid, err := app.store.Token.ValidateResetPasswordToken(token)
	if err != nil {
		app.logger.Errorw("failed to validate token", "error", err)
		app.internalServerError(w, r, err)
		return
	}
	if !valid {
		app.logger.Errorw("invalid token", "token", token)
		app.badRequestResponse(w, r, errors.New("invalid or expired token"))
		return
	}
	if err := app.jsonResponse(w, http.StatusOK, "valid token"); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

type ResetPasswordPayload struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=6,max=72"`
}

// resetPasswordHandler godoc
//
//	@Summary		Reset password
//	@Description	Reset password using a valid token
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		ResetPasswordPayload	true	"Reset password payload"
//	@Success		200		{string}	string					"password reset successfully"
//	@Failure		400		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Router			/auth/reset-password [put]
func (app *application) resetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	var payload ResetPasswordPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.logger.Errorw("failed to read request body", "error", err)
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.logger.Errorw("failed to validate request payload", "error", err)
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()
	if err := app.store.Users.ResetPassword(ctx, payload.Token, payload.Password); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, "password reset successfully"); err != nil {
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infow("password reset successfully")
}
