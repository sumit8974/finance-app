package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNotFound          = errors.New("resource not found")
	ErrConflict          = errors.New("resource already exists")
	QueryTimeoutDuration = time.Second * 5
)

type Storage struct {
	Users interface {
		GetByID(context.Context, int64) (*User, error)
		GetByEmail(context.Context, string) (*User, error)
		Create(context.Context, *sql.Tx, *User) error
		CreateAndInvite(ctx context.Context, user *User, token string, exp time.Duration) error
		Activate(context.Context, string) error
		Delete(context.Context, int64) error
	}
	Transactions interface {
		Create(context.Context, *Transaction) (*Transaction, error)
		// add filtes for start date, end date, amount, transaction type in listtransactions
		ListTransactionsByUser(context.Context, int64, ListTransactionsByUserFilter) ([]Transaction, error)
		GetByID(context.Context, int64) (*Transaction, error)
		Update(context.Context, *Transaction) error
		DeleteByID(context.Context, int64) error
	}
	Category interface {
		Create(context.Context, *Category) (*Category, error)
		GetByName(context.Context, string) (*Category, error)
		ListCategories(ctx context.Context) ([]*Category, error)
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Users:     &UserStore{db},
		Transactions: &TransactionStore{db: db},
		Category:  &CategoryStore{db: db},
	}
}

func withTx(db *sql.DB, ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}