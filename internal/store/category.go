package store

import (
	"context"
	"database/sql"
)


type CategoryStore struct {
	db *sql.DB
}

type Category struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

func (c *CategoryStore) Create(ctx context.Context, category *Category) (*Category, error) {
	// TODO: Implement the Create method for CategoryStore
	return nil, nil
}

func (c *CategoryStore) ListCategories(ctx context.Context) ([]*Category, error) {
	query := `
		SELECT id, name, type
		FROM categories
	`
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()
	
	rows, err := c.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*Category
	for rows.Next() {
		category := &Category{}
		if err := rows.Scan(&category.ID, &category.Name, &category.Type); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}
	return categories, nil
}

func (c *CategoryStore) GetByName(ctx context.Context, name string) (*Category, error) {
	query := `
		SELECT id, name, type
		FROM categories
		WHERE name = $1
	`
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()
	
	category := &Category{}
	err := c.db.QueryRowContext(ctx, query, name).Scan(&category.ID, &category.Name, &category.Type)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound // No category found
		}
		return nil, err // Some other error occurred
	}
	return category, nil
}