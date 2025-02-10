// frontend/src/index.js

import React from "react";
import ReactDOM from "react-dom";
import './index.css'; // <--- This is crucial
import App from "./App";
import { UserProvider } from "./contexts/UserContext";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./queryClient";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </UserProvider>
      <ToastContainer />
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
