// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuctionList from './components/AuctionList';
import CreateAuction from './components/CreateAuction';
import UpdateAuction from './components/UpdateAuction';
import Login from './components/Login';
import Register from './components/Register';
import NavBar from './components/NavBar';
import ProductDetail from './components/ProductDetail'; // New Component
import MyPurchases from './components/MyPurchases'; // New Component
import BidHistory from './components/BidHistory'; // Import BidHistory component
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Carousel CSS

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
        <NavBar />
        <Routes>
          <Route path="/" element={<AuctionList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<PrivateRoute element={CreateAuction} />} />
          <Route path="/update/:id" element={<PrivateRoute element={UpdateAuction} />} />
          <Route path="/auction/:id" element={<ProductDetail />} /> {/* New Route */}
          <Route path="/my-bids" element={<PrivateRoute element={BidHistory} />} /> {/* Protected */}
          <Route path="/my-purchases" element={<PrivateRoute element={MyPurchases} />} /> {/* Protected */}
          {/* Add more routes as needed */}
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
