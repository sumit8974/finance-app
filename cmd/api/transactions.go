package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/sumit8974/finance-tracker/internal/store"
)

type CreateTransactionRequest struct {
	Amount          float64 `json:"amount"`
	TransactionType string  `json:"transactionType"`
	Description     string  `json:"description"`
	CategoryName    string  `json:"categoryName"`
}

// createTransactionHandler godoc
//
//	@Summary		Create a new transaction
//	@Description	Create a new transaction for the authenticated user
//	@Tags			transactions
//	@Accept			json
//	@Produce		json
//	@Param			transaction	body		CreateTransactionRequest	true	"Transaction data"
//	@Success		201			{object}	store.Transaction
//	@Failure		400			{object}	error
//	@Failure		401			{object}	error
//	@Failure		500			{object}	error
//	@Security		ApiKeyAuth
//	@Router			/transactions [post]
func (app *application) createTransactionHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateTransactionRequest
	err := readJSON(w, r, &payload)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := getUserFromContext(r)

	// TODO: Try to get the category id using the category name from the database
	ctx := r.Context()
	fmt.Println("payload", payload)
	categoryDetails, err := app.store.Category.GetByName(ctx, strings.ToLower(payload.CategoryName))
	if categoryDetails == nil {
		app.badRequestResponse(w, r, fmt.Errorf("category not found"))
		return
	}
	if err != nil {
		if err == store.ErrNotFound {
			app.badRequestResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}
	// For now, we are assuming that the category name is the same as the category id
	transaction := &store.Transaction{
		UserID:          user.ID,
		Amount:          payload.Amount,
		TransactionType: payload.TransactionType,
		Description:     payload.Description,
		CategoryID:      categoryDetails.ID,
	}

	transactionData, err := app.store.Transactions.Create(ctx, transaction)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusCreated, transactionData)
	if err != nil {
		app.internalServerError(w, r, err)
	}
	app.logger.Infof("Transaction created: %v", transactionData)
}

// listTransactionsHandler godoc
//
//	@Summary		List transactions for the authenticated user
//	@Description	List transactions for the authenticated user
//	@Tags			transactions
//	@Produce		json
//	@Success		200	{array}		store.Transaction
//	@Failure		401	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/transactions [get]
//	@Param			startDate		query	string	false	"Start date in RFC3339 format"
//	@Param			endDate			query	string	false	"End date in RFC3339 format"
//	@Param			transactionType	query	string	false	"Transaction type (income/expense)"
func (app *application) listTransactionsHandler(w http.ResponseWriter, r *http.Request) {
	var listTransactionsFilter store.ListTransactionsByUserFilter
	queryParams := r.URL.Query()
	if startDate := queryParams.Get("startDate"); startDate != "" {
		_, err := time.Parse(time.DateOnly, startDate)
		if err != nil {
			app.badRequestResponse(w, r, err)
			return
		}
		listTransactionsFilter.StartDate = startDate
	}
	if endDate := queryParams.Get("endDate"); endDate != "" {
		_, err := time.Parse(time.DateOnly, endDate)
		if err != nil {
			app.badRequestResponse(w, r, err)
			return
		}
		listTransactionsFilter.EndDate = endDate
	}
	transactionType := queryParams.Get("transactionType")
	if transactionType != "" {
		if transactionType != "income" && transactionType != "expense" {
			app.badRequestResponse(w, r, fmt.Errorf("invalid transaction type: %s", transactionType))
			return
		}
		listTransactionsFilter.TransactionType = transactionType
	}

	if err := Validate.Struct(listTransactionsFilter); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}
	user := getUserFromContext(r)

	ctx := r.Context()
	transactions, err := app.store.Transactions.ListTransactionsByUser(ctx, user.ID, listTransactionsFilter)
	if err != nil {
		if err == store.ErrNotFound {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}
	fmt.Println("transaction", transactions)
	err = app.jsonResponse(w, http.StatusOK, transactions)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infof("Transactions listed: %v", transactions)
}

// getTransactionByIDHandler godoc
//
//	@Summary		Get a transaction by ID
//	@Description	Get a transaction by ID for the authenticated user
//	@Tags			transactions
//	@Produce		json
//	@Param			id	path		int	true	"Transaction ID"
//	@Success		200	{object}	store.Transaction
//	@Failure		400	{object}	error
//	@Failure		401	{object}	error
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/transactions/{id} [get]
func (app *application) getTransactionByIDHandler(w http.ResponseWriter, r *http.Request) {

	transaction := getTransactionFromContext(r)
	err := app.jsonResponse(w, http.StatusOK, transaction)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infof("Transaction retrieved: %v", transaction)
}

// deleteTransactionByIDHandler godoc
//
//	@Summary		Delete a transaction by ID
//	@Description	Delete a transaction by ID for the authenticated user
//	@Tags			transactions
//	@Produce		json
//	@Param			id	path		int	true	"Transaction ID"
//	@Success		204	{object}	nil
//	@Failure		400	{object}	error
//	@Failure		401	{object}	error
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/transactions/{id} [delete]
func (app *application) deleteTransactionByIDHandler(w http.ResponseWriter, r *http.Request) {
	transaction := getTransactionFromContext(r)
	ctx := r.Context()
	if err := app.store.Transactions.DeleteByID(ctx, transaction.ID); err != nil {
		app.logger.Errorw("error deleting transaction", "error", err)
		if err == store.ErrNotFound {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}
	err := app.jsonResponse(w, http.StatusNoContent, nil)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infof("Transaction deleted: %d", transaction.ID)
}

type UpdateTransactionRequest struct {
	CreateTransactionRequest
}

// updateTransactionByIDHandler godoc
//
//	@Summary		Update a transaction by ID
//	@Description	Update a transaction by ID for the authenticated user
//	@Tags			transactions
//	@Produce		json
//	@Param			id			path		int							true	"Transaction ID"
//	@Param			transaction	body		UpdateTransactionRequest	true	"Transaction data"
//	@Success		200			{object}	store.Transaction
//	@Failure		400			{object}	error
//	@Failure		401			{object}	error
//	@Failure		404			{object}	error
//	@Failure		500			{object}	error
//	@Security		ApiKeyAuth
//	@Router			/transactions/{id} [patch]
func (app *application) updateTransactionByIDHandler(w http.ResponseWriter, r *http.Request) {
	var payload UpdateTransactionRequest
	// Read the request body into the payload struct
	// Validate the payload
	err := readJSON(w, r, &payload)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}
	transaction := getTransactionFromContext(r)

	ctx := r.Context()
	categoryDetails, err := app.store.Category.GetByName(ctx, strings.ToLower(payload.CategoryName))
	if err != nil {
		if err == store.ErrNotFound {
			app.badRequestResponse(w, r, fmt.Errorf("category not found"))
			return
		}
		fmt.Println("error", err)
		app.internalServerError(w, r, err)
		return
	}

	transaction.Amount = payload.Amount
	transaction.TransactionType = payload.TransactionType
	transaction.Description = payload.Description
	transaction.CategoryID = categoryDetails.ID
	err = app.store.Transactions.Update(ctx, transaction)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
	transaction.CategoryName = categoryDetails.Name

	err = app.jsonResponse(w, http.StatusOK, transaction)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infof("Transaction updated: %v", transaction)
}

func (app *application) transactionContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		transactionID := chi.URLParam(r, "id")
		transactionIDInt, err := strconv.ParseInt(transactionID, 10, 64)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("invalid transaction ID: %s", transactionID))
			return
		}
		if transactionIDInt <= 0 {
			app.badRequestResponse(w, r, fmt.Errorf("invalid transaction ID: %s", transactionID))
			return
		}

		ctx := r.Context()
		transaction, err := app.store.Transactions.GetByID(ctx, transactionIDInt)
		if err != nil {
			if err == store.ErrNotFound {
				app.notFoundResponse(w, r, err)
				return
			}
			app.internalServerError(w, r, err)
			return
		}
		ctx = context.WithValue(r.Context(), transactionCtx, transaction)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getTransactionFromContext(r *http.Request) *store.Transaction {
	transaction, _ := r.Context().Value(transactionCtx).(*store.Transaction)
	return transaction
}