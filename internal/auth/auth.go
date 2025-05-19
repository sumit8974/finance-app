package auth

import "github.com/golang-jwt/jwt/v5"


type Authenticator interface {
	// GenerateToken generates a new token for the user.
	GenerateToken(claims jwt.Claims) (string, error)
	// ValidateToken validates the token and returns the user ID.
	ValidateToken(tokenString string) (*jwt.Token, error)
}