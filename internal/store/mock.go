package store

import (
	"context"
	"database/sql"
	"time"

	"github.com/stretchr/testify/mock"
)

func NewMockStore() Storage {
	return Storage{
		Users: &MockUserStore{},
	}
}

type MockUserStore struct {
	mock.Mock
}

func (m *MockUserStore) Create(ctx context.Context, tx *sql.Tx, u *User) error {
	return nil
}

func (m *MockUserStore) GetByID(ctx context.Context, userID int64) (*User, error) {
	return &User{ID: userID}, nil
}

func (m *MockUserStore) GetByEmail(context.Context, string) (*User, error) {
	return &User{}, nil
}

func (m *MockUserStore) CreateAndInvite(ctx context.Context, user *User, token string, exp time.Duration) error {
	return nil
}

func (m *MockUserStore) Activate(ctx context.Context, t string) error {
	return nil
}

func (m *MockUserStore) Delete(ctx context.Context, id int64) error {
	return nil
}

func (m *MockUserStore) CreateUserResetPasswordToken(ctx context.Context, userID int64, token string, exp time.Duration) error {
	return nil
}

func (m *MockUserStore) DeleteUserResetPasswordToken(ctx context.Context, token string) error {
	return nil
}

func (m *MockUserStore) GetUserResetPasswordTokenCount(ctx context.Context, userID int64) (int64, error) {
	return 0, nil
}

func (m *MockUserStore) ResetPassword(ctx context.Context, token string, newPassword string) error {
	return nil
}
