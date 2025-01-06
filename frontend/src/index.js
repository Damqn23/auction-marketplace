// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { UserProvider } from './contexts/UserContext';
import './index.css';
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS


ReactDOM.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
