package store

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"time"
)

type Token struct {
	db *sql.DB
}

func (t *Token) Validate(token string) (bool, error) {
	hash := sha256.Sum256([]byte(token))
	hashToken := hex.EncodeToString(hash[:])
	var exists bool
	query := `SELECT EXISTS(SELECT 1 from user_invitations WHERE token = $1 AND expiry > $2)`
	err := t.db.QueryRow(query, hashToken, time.Now()).Scan(&exists)
	if err != nil {
		switch {
		case err == sql.ErrNoRows:
			return false, nil
		default:
			return false, err
		}
	}
	return exists, nil
}
