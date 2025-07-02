# Finance App

This is a full-stack finance tracking application. It helps users manage their personal finances, track income and expenses, and categorize transactions.

## Project Structure

The project is organized into two main parts:

- **Backend**: Written in Go, located in the `cmd/` and `internal/` directories. It provides a RESTful API for managing financial data.
- **Frontend**: A web application built with React, Vite, and TypeScript, located in the `web/` directory. It consumes the backend API to provide a user-friendly interface.

## Technologies Used

### Backend

- Go
- Chi router
- PostgreSQL (assumed, based on `pq` driver and migrations)
- JWT for authentication
- Swagger for API documentation

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn-ui
- Axios for API calls
- Recharts for data visualization

## Getting Started

### Prerequisites

- Go (version 1.24 or later)
- Node.js and npm (for the frontend)
- PostgreSQL server (running and accessible)

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```
2.  **Configure environment variables:**
    Create a `.env` file in the root directory or in `cmd/api/` (based on typical Go practices, though not explicitly stated) and set necessary variables like database connection string, JWT secret, etc.
    ```env
    # Example .env
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=youruser
    DB_PASSWORD=yourpassword
    DB_NAME=financedb
    JWT_SECRET=yourjwtsecret
    SENDGRID_API_KEY=yoursendgridkey # If using SendGrid for emails
    # ... other variables
    ```
3.  **Run database migrations:**
    Navigate to the `cmd/migrate/` directory (or use Makefile if available).
    ```bash
    # Example (actual command might vary based on migration tool setup)
    # Consult Makefile or migration script for exact commands
    make migrate-up
    ```
    Or, if using `go-migrate` directly (assuming it's installed):
    ```bash
    # cd cmd/migrate
    # migrate -path ./migrations -database "postgres://user:password@host:port/dbname?sslmode=disable" up
    ```
4.  **Run the backend server:**
    ```bash
    cd cmd/api
    go run main.go
    ```
    The API server should start, typically on a port like `8080` or `3000`. Check the application logs for the exact port.

### Frontend Setup

1.  **Navigate to the web directory:**
    ```bash
    cd web
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure API endpoint:**
    Ensure the frontend knows where the backend API is running. This is usually configured in a `.env` file in the `web/` directory or directly in the API client setup (e.g., `web/src/api/axios.ts`).
    ```env
    # Example web/.env file
    VITE_API_BASE_URL=http://localhost:8080/api
    ```
4.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically on `http://localhost:5173`.

## API Documentation

API documentation is available via Swagger. Once the backend server is running, you can usually access it at an endpoint like `/swagger/index.html`.
Example: `http://localhost:8080/swagger/index.html`

## Contributing

Please refer to `CONTRIBUTING.md` for details on how to contribute to this project (if such a file exists).

## License

This project is licensed under the [MIT License](LICENSE) (assuming, please add a LICENSE file if one doesn't exist).
