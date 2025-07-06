package main

import (
	"fmt"
	"io"
	"net/http"

	_ "github.com/sumit8974/finance-tracker/internal/extractor"
)

// processReceipt godoc
//
//	@Summary		Process receipt
//	@Description	Process a receipt image and extract text using OCR
//	@Tags			receipts
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			receipt	formData	file	true	"Receipt image file"
//	@Success		200		{object}	extractor.ExtractedTransaction
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Router			/receipts [post]
func (app *application) processReceipt(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20) // Limit request body to 10MB
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("error parsing form data: %v", err))
		return
	}
	receiptFile, _, err := r.FormFile("receipt")
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("error retrieving receipt file: %v", err))
		return
	}
	defer receiptFile.Close()
	fileBytes, err := io.ReadAll(receiptFile)
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("error reading receipt file: %v", err))
		return
	}
	data, err := app.extractor.ExtractTransaction(fileBytes, "receipt.png")
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("error extracting transaction: %v", err))
		return
	}
	if err := app.jsonResponse(w, http.StatusOK, data); err != nil {
		app.internalServerError(w, r, fmt.Errorf("error sending response: %v", err))
		return
	}
	app.logger.Infof("Receipt processed successfully: %s", r.FormValue("receipt"))
}
