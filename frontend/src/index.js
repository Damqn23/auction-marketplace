// frontend/src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import './index.css'; // <--- This is crucial
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { UserProvider } from "./contexts/UserContext";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./queryClient";
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { ToastContainer } from "react-toastify";
import { NotificationProvider } from "./contexts/NotificationContext";
import "react-toastify/dist/ReactToastify.css";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </NotificationProvider>
        </ThemeProvider>
      </UserProvider>
      <ToastContainer />
    </QueryClientProvider>
  </React.StrictMode>
);
