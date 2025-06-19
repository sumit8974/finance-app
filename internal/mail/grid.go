package mail

import (
	"bytes"
	"fmt"
	"text/template"
	"time"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type SendGridMailer struct {
	fromEmail string
	apiKey    string
	client    *sendgrid.Client
}

func NewSendGrid(apiKey, fromEmail string) *SendGridMailer {
	client := sendgrid.NewSendClient(apiKey)

	return &SendGridMailer{
		fromEmail: fromEmail,
		apiKey: apiKey,
		client: client,
	}
}

func (sg SendGridMailer) Send(templateFile, username, email string, data any, isSandbox bool) (int, error) {
	from := mail.NewEmail(FromName, sg.fromEmail)
	to := mail.NewEmail(username, email)

	templ, err := template.ParseFS(FS, "templates/"+templateFile)
	if err != nil {
		return -1, err
	}

	subject := new(bytes.Buffer)
	err = templ.ExecuteTemplate(subject, "subject", data)
	if err != nil {
		return -1, err
	}

	body := new(bytes.Buffer)
	err = templ.ExecuteTemplate(body, "body", data)
	if err != nil {
		return -1, err
	}

	message := mail.NewSingleEmail(from, subject.String(), to, "", body.String())
	message.SetMailSettings(&mail.MailSettings{
		SandboxMode: &mail.Setting{
			Enable: &isSandbox,
		},
	})

	var retryErr error
	for i := range maxRetires {
		response, retryErr := sg.client.Send(message)
		if retryErr != nil {
			time.Sleep(time.Second * time.Duration(i+1))
			continue
		}
		return response.StatusCode, nil
	}
	return -1, fmt.Errorf("Failed to sent email after %d attempt, error: %v", maxRetires, retryErr)
}