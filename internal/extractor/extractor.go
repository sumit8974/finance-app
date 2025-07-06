package extractor

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"google.golang.org/genai"
)

type ExtractorService interface {
	ExtractTransaction(data []byte, filename string) (ExtractedTransaction, error)
}

type geminiExtractor struct {
	client *genai.Client
}

func NewGeminiExtractor(client *genai.Client) ExtractorService {
	return &geminiExtractor{
		client: client,
	}
}

type ExtractedTransaction struct {
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
	Date        string  `json:"date"`
	Category    string  `json:"category"`
}

func (g *geminiExtractor) ExtractTransaction(data []byte, filename string) (ExtractedTransaction, error) {
	model := "gemini-1.5-flash"
	parts := []*genai.Part{
		genai.NewPartFromText(`
		Analyze this receipt image and extract the following information in JSON format:
		- Total amount (just the number also convert the amount to INR if not already in INR)
		- Date (in UTC time and RFC3339 format, e.g., 2023-10-01T12:00:00Z)
		- Description or items purchased (brief summary in about 5 words)
		- Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,gifts,other)
		
		Only respond with valid JSON in this exact format:
		{
			"amount": number,
			"date": "string",
			"description": "string",
			"category": "string"
		}

		If its not a recipt, return an empty object
		`),
		{
			InlineData: &genai.Blob{
				MIMEType: "image/png",
				Data:     data,
			},
		},
	}

	contents := []*genai.Content{
		genai.NewContentFromParts(parts, genai.RoleUser),
	}

	result, err := g.client.Models.GenerateContent(context.Background(), model, contents, nil)
	if err != nil {
		return ExtractedTransaction{}, err
	}
	text := result.Text()
	re := regexp.MustCompile("(?m)```(?:json)?\\n?")
	text = re.ReplaceAllString(text, "")
	text = strings.TrimSuffix(text, "```")
	var extracted ExtractedTransaction
	if err := json.Unmarshal([]byte(text), &extracted); err != nil {
		return ExtractedTransaction{}, fmt.Errorf("failed to unmarshal extracted data: %w", err)
	}
	return extracted, nil
}
