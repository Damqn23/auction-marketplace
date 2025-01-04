// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuctionList from './components/AuctionList';
import CreateAuction from './components/CreateAuction';
import UpdateAuction from './components/UpdateAuction';
import Login from './components/Login';
import { ToastContainer } from 'react-toastify'; // For toast notifications
import 'react-toastify/dist/ReactToastify.css';   // Import toastify CSS

const isAuthenticated = () => {
  return localStorage.getItem('access_token') ? true : false;
};

const PrivateRoute = ({ element: Element, ...rest }) => {
  return isAuthenticated() ? <Element /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <h1>Auction Marketplace</h1>
        <Routes>
          <Route path="/" element={<AuctionList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={<PrivateRoute element={CreateAuction} />} />
          <Route path="/update/:id" element={<PrivateRoute element={UpdateAuction} />} />
          {/* Add more routes as needed */}
        </Routes>
        <ToastContainer /> {/* Centralized ToastContainer */}
      </div>
    </Router>
  );
}

export default App;
