package store

import (
	"context"
	"database/sql"
	"fmt"
)

type Transaction struct {
	ID              int64   `json:"id"`
	UserID          int64   `json:"userId"`
	Amount          float64 `json:"amount"`
	CategoryName    string  `json:"categoryName"`
	CategoryID      int64   `json:"categoryId"`
	TransactionType string  `json:"transactionType"`
	TransactionDate string  `json:"transactionDate"` // Assuming this is a string for simplicity, could be time.Time
	Description     string  `json:"description"`
	CreatedAt       string  `json:"createdAt"`
	UpdatedAt       string  `json:"updatedAt"`
}

type TransactionStore struct {
	db *sql.DB
}

func (t *TransactionStore) Create(ctx context.Context, transaction *Transaction) (*Transaction, error) {
	query := `
		INSERT INTO individual_transactions (user_id, amount, category_id, transaction_type, description, transaction_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at, transaction_date
	`
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := t.db.QueryRowContext(ctx, query,
		transaction.UserID,
		transaction.Amount,
		transaction.CategoryID,
		transaction.TransactionType,
		transaction.Description,
		transaction.TransactionDate,
	).Scan(&transaction.ID, &transaction.CreatedAt, &transaction.UpdatedAt, &transaction.TransactionDate)
	if err != nil {
		return nil, err
	}

	return transaction, nil
}

type ListTransactionsByUserFilter struct {
	StartDate       string `json:"startDate"`
	EndDate         string `json:"endDate"`
	TransactionType string `json:"transactionType"`
}
type ListTransactionsResponse struct {
	Transaction
	CreatedAt string `json:"createdAt"`
	CreatedBy string `json:"createdBy"`
}

func (t *TransactionStore) ListTransactionsByUser(ctx context.Context, userID int64, filter ListTransactionsByUserFilter) ([]Transaction, error) {
	// write a join query to get the transactions with category name
	query := `
		SELECT t.id, t.user_id, t.amount, c.name as category_name, t.transaction_type, t.description, t.created_at, t.updated_at, t.transaction_date
		FROM individual_transactions t
		JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1
	`
	args := []interface{}{userID}

	if filter.StartDate != "" {
		query += " AND t.created_at >= $2"
		args = append(args, filter.StartDate)
	}
	if filter.EndDate != "" {
		query += " AND t.created_at <= $3"
		args = append(args, filter.EndDate)
	}
	if filter.TransactionType != "" {
		query += " AND t.transaction_type = $4"
		args = append(args, filter.TransactionType)
	}

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()
	rows, err := t.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		transaction := &Transaction{}
		fmt.Println("Scanning transaction row")
		err := rows.Scan(&transaction.ID, &transaction.UserID, &transaction.Amount,
			&transaction.CategoryName, &transaction.TransactionType, &transaction.Description, &transaction.CreatedAt,
			&transaction.UpdatedAt, &transaction.TransactionDate)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, *transaction)
	}

	return transactions, nil
}

func (t *TransactionStore) GetByID(ctx context.Context, transactionID int64) (*Transaction, error) {
	query := `
		SELECT id, user_id, amount, category_id, transaction_type, description,created_at, updated_at, transaction_date
		FROM individual_transactions
		WHERE id = $1
	`
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	transaction := &Transaction{}
	err := t.db.QueryRowContext(ctx, query, transactionID).Scan(
		&transaction.ID,
		&transaction.UserID,
		&transaction.Amount,
		&transaction.CategoryID,
		&transaction.TransactionType,
		&transaction.Description,
		&transaction.CreatedAt,
		&transaction.UpdatedAt,
		&transaction.TransactionDate,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return transaction, nil
}

func (t *TransactionStore) DeleteByID(ctx context.Context, transactionID int64) error {
	query := `
		DELETE FROM individual_transactions
		WHERE id = $1
	`
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	result, err := t.db.ExecContext(ctx, query, transactionID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (t *TransactionStore) Update(ctx context.Context, transaction *Transaction) error {
	fmt.Println("Updating transaction:", transaction)
	query := `
		UPDATE individual_transactions
		SET amount = $1, category_id = $2, transaction_type = $3, description = $4, updated_at = NOW(), transaction_date = $5
		WHERE id = $6 AND user_id = $7
		RETURNING updated_at, transaction_date
	`
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := t.db.QueryRowContext(ctx, query,
		transaction.Amount,
		transaction.CategoryID,
		transaction.TransactionType,
		transaction.Description,
		transaction.TransactionDate,
		transaction.ID,
		transaction.UserID,

	).Scan(&transaction.UpdatedAt, &transaction.TransactionDate)
	if err != nil {
		switch {
		case err == sql.ErrNoRows:
			return ErrNotFound
		default:
			return err
		}
	}
	return nil
}
