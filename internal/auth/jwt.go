package auth

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

type JWTAuthenticator struct {
	secretKey string
	iss       string
	aud       string
}

func NewJWTAuthenticator(secretKey, iss, aud string) *JWTAuthenticator {
	return &JWTAuthenticator{
		secretKey: secretKey,
		iss:       iss,
		aud:       aud,
	}
}

func (a *JWTAuthenticator) GenerateToken(claims jwt.Claims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// token.Header["iss"] = a.iss
	// token.Header["aud"] = a.aud

	signedToken, err := token.SignedString([]byte(a.secretKey))
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

func (a *JWTAuthenticator) ValidateToken(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(a.secretKey), nil
	},
		jwt.WithIssuer(a.iss),
		jwt.WithAudience(a.aud),
		jwt.WithExpirationRequired(),
		jwt.WithValidMethods([]string{"HS256"}),
	)
}
