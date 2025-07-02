# Frontend Application

This directory contains the frontend web application for the Finance App.

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Axios (for API communication)
- Recharts (for charts and data visualization)
- React Router (for navigation)
- Zod (for schema validation)

## Getting Started

### Prerequisites

- Node.js and npm (or yarn)

### Setup and Running

1.  **Navigate to the web directory:**
    If you are in the root of the project, change to the `web` directory:
    ```bash
    cd web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in this `web/` directory (e.g., `web/.env`). This file is used to configure the application, primarily to set the base URL for the backend API.
    Example:
    ```env
    VITE_API_BASE_URL=http://localhost:8080/api
    ```
    Replace `http://localhost:8080/api` with the actual URL where your backend API is running.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    This will start the Vite development server, typically available at `http://localhost:5173`. The application will automatically reload if you make changes to the source files.

5.  **Build for production:**
    To create a production build:
    ```bash
    npm run build
    # or
    # yarn build
    ```
    The production-ready files will be placed in the `dist/` directory.

## Project Structure Highlights

-   `src/`: Contains the main source code for the React application.
    -   `main.tsx`: The entry point of the application.
    -   `App.tsx`: The root component, setting up routing and global providers.
    -   `pages/`: Components representing different pages/views of the application.
    -   `components/`: Reusable UI components.
        -   `ui/`: Auto-generated components from shadcn-ui.
    -   `api/`: Code related to backend API communication (e.g., Axios instance).
    -   `context/`: React context providers for global state management.
    -   `hooks/`: Custom React hooks.
    -   `lib/`: Utility functions and libraries.
-   `public/`: Static assets that are served directly.
-   `index.html`: The main HTML file for the single-page application.
-   `vite.config.ts`: Vite configuration file.
-   `tailwind.config.ts`: Tailwind CSS configuration.
-   `tsconfig.json`: TypeScript configuration.

## Available Scripts

In the `package.json` file, you can find several scripts:

-   `dev`: Starts the development server.
-   `build`: Builds the application for production.
-   `lint`: Lints the codebase using ESLint.
-   `preview`: Serves the production build locally for preview.

## Further Information

For more details on the overall project, including the backend setup, please refer to the main `README.md` file in the root directory of the repository.

---

*This README was updated to provide general setup and development information. Previous Lovable-specific content has been removed or generalized.*
