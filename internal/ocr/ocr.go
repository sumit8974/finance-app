package ocr

import "github.com/otiai10/gosseract/v2"

type OCRService interface {
	ExtractTextFromImage(data []byte) (string, error)
}

type ocrService struct {
	// Add any fields needed for the OCR service, such as an API client or configuration
}
func NewOCRService() OCRService {
	return &ocrService{}
}

func (s *ocrService) ExtractTextFromImage(data []byte) (string, error) {
	client := gosseract.NewClient()
	defer client.Close()

	client.SetImageFromBytes(data)
	text, err := client.Text()
	if err != nil {
		return "", err
	}
	return text, nil
}