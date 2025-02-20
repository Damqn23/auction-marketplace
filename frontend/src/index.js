// frontend/src/index.js

import React from "react";
import ReactDOM from "react-dom";
import './index.css'; // <--- This is crucial
import App from "./App";
import { UserProvider } from "./contexts/UserContext";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./queryClient";
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
      <ThemeProvider theme={theme}>
          <App />
          </ThemeProvider>
      </UserProvider>
      <ToastContainer />
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
