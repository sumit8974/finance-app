package main

import "net/http"

// listCategories godoc
//
//	@Summary		List all categories
//	@Description	List all categories
//	@Tags			categories
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	[]store.Category
//	@Failure		500	{object}	error
//	@Router			/categories [get]
// @Security		ApiKeyAuth
func (app *application) listCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	categories, err := app.store.Category.ListCategories(ctx)
	if err != nil {
		app.logger.Errorw("failed to get categories", "error", err)
		app.internalServerError(w, r, err)
		return
	}
	if err := app.jsonResponse(w, http.StatusOK, categories); err != nil {
		app.logger.Errorw("failed to write response", "error", err)
	}
}