package main

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sumit8974/finance-tracker/internal/store"
)

func getUserFromContext(r *http.Request) *store.User {
	user, _ := r.Context().Value(userCtx).(*store.User)
	return user
}

type GetUserByTokenResponse struct {
	User *store.User `json:"user"`
}

// getUserByTokenHandler godoc
//
//	@Summary		Get user by token
//	@Description	Get user by token
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	GetUserByTokenResponse
//	@Failure		401	{object}	error
//	@Failure		500	{object}	error
//	@Router			/users/token [get]
//
//	@Security		ApiKeyAuth
func (app *application) getUserByTokenHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.logger.Errorw("failed to get user from context")
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("user not found in context"))
		return
	}
	userDetails := &GetUserByTokenResponse{
		User: user,
	}
	if err := app.jsonResponse(w, http.StatusOK, userDetails); err != nil {
		app.logger.Errorw("failed to write response", "error", err)
	}
}

// activateUserHander godoc
//
//	@Summary		Activate user
//	@Description	Acitvate a new user account
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			token	path		string	true	"User invitation token"
//	@Success		204		{string}	string	"User activated"
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Router			/users/activate/{token} [put]
func (app *application) activateUserHandler(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")

	err := app.store.Users.Activate(r.Context(), token)

	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}
	if err := app.jsonResponse(w, http.StatusNoContent, ""); err != nil {
		app.internalServerError(w, r, err)
	}
}
