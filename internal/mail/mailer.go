package mail

import (
	"bytes"
	"embed"
	"text/template"
)


const (
	FromName = "FinTracker"
	maxRetires = 3
    UserWelcomeTemplate = "user_invitation.tmpl"
)

//go:embed "templates"
var FS embed.FS

type MailerClient interface {
	Send(templateFile, username, email string, data any, isSandbox bool) (int, error)
}

type TemplateParser interface {
	Parse(data any) (*bytes.Buffer, * bytes.Buffer, error)
}


type HtmlParser struct {
	FileName string
}

func (tp *HtmlParser) Parse(data any) (*bytes.Buffer, * bytes.Buffer, error) {
	// Template parsing and building
	tmpl, err := template.ParseFS(FS, "templates/"+tp.FileName)
	if err != nil {
		return nil, nil, err
	}

	subject := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(subject, "subject", data)
	if err != nil {
		return nil, nil, err
	}

	body := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(body, "body", data)
	if err != nil {
		return nil, nil, err
	}
	return subject, body, nil

}