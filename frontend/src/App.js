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
import ChatList from './components/ChatList'; // Import the new Chat List page
import Chat from './components/Chat'; // Import Chat component
import NotFound from './components/NotFound'; // Add NotFound component
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Carousel CSS

// Import React Query dependencies
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

// Initialize QueryClient
const queryClient = new QueryClient();

/**
 * Function to check if the user is authenticated.
 * Adjust this logic based on how you handle authentication tokens.
 */
const isAuthenticated = () => {
  return localStorage.getItem('access_token') ? true : false;
};

/**
 * PrivateRoute Component
 * Renders the desired component if the user is authenticated.
 * Otherwise, redirects the user to the login page.
 */
const PrivateRoute = ({ element: Element, ...rest }) => {
  return isAuthenticated() ? <Element /> : <Navigate to="/login" />;
};

/**
 * App Component
 * Sets up the routing for the application, including public and private routes.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          {/* Navigation Bar */}
          <NavBar />

          {/* Define Routes */}
          <Routes>
            {/* Redirect the root path '/' to '/auction-list' */}
            <Route path="/" element={<Navigate to="/auction-list" />} />

            {/* Public Routes */}
            <Route path="/auction-list" element={<AuctionList />} />
            <Route path="/auction/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Private Routes */}
            <Route path="/create" element={<PrivateRoute element={CreateAuction} />} />
            <Route path="/update/:id" element={<PrivateRoute element={UpdateAuction} />} />
            <Route path="/my-bids" element={<PrivateRoute element={BidHistory} />} />
            <Route path="/my-purchases" element={<PrivateRoute element={MyPurchases} />} />
            <Route path="/chat" element={<PrivateRoute element={ChatList} />} />
            <Route path="/chat/:ownerUsername" element={<PrivateRoute element={Chat} />} />

            {/* Catch-All Route for 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
