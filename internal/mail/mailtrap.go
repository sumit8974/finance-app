package mail

import (
	"errors"
	"fmt"
	"time"

	gomail "gopkg.in/mail.v2"
)

type mailtrapClient struct {
	fromEmail string
	apiKey    string
	appPass	  string
	parser    TemplateParser
}

func NewMailTrapClient(apiKey, fromEmail, appPass string, parser TemplateParser) (mailtrapClient, error) {
	if apiKey == "" {
		return mailtrapClient{}, errors.New("api key is required")
	}

	return mailtrapClient{
		fromEmail: fromEmail,
		appPass:   appPass,
		apiKey:    apiKey,
		parser:    parser,
	}, nil
}

func (m mailtrapClient) Send(templateFile, username, email string, data any, isSandbox bool) (int, error) {
	if isSandbox {
		return 200, nil
	}
	// Template parsing and building
	subject, body, err := m.parser.Parse(data)
	if err != nil {
		return -1, err
	}

	message := gomail.NewMessage()
	message.SetHeader("From", m.fromEmail)
	message.SetHeader("To", email)
	message.SetHeader("Subject", subject.String())

	// message.AddAlternative("text/html", body.String())
	message.SetBody("text/html", body.String())
    fmt.Println("V", m)
	// dialer := gomail.NewDialer("live.smtp.mailtrap.io", 587, "api", m.apiKey)
	dialer := gomail.NewDialer("smtp.gmail.com", 587, m.fromEmail, m.appPass)
    fmt.Println("MSG", message)
	var retryErr error
	for i := range maxRetires {
		retryErr = dialer.DialAndSend(message)
		if retryErr != nil {
			time.Sleep(time.Second * time.Duration(i+1))
			continue
		}
		return 200, nil
	}
	return -1, fmt.Errorf("Failed to sent email after %d attempt, error: %v", maxRetires, retryErr)
}
