import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { TransactionProvider } from "./context/TransactionContext";
import { ThemeProvider } from "./components/ThemeProvider";
import React from "react";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="finance-theme">
      <AuthProvider>
        <TransactionProvider>
          <App />
        </TransactionProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
