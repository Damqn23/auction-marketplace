import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import AuctionList from './components/AuctionList';
import CreateAuction from './components/CreateAuction';
import UpdateAuction from './components/UpdateAuction';
import Login from './components/Login';
import Register from './components/Register';
import NavBar from './components/NavBar';
import ProductDetail from './components/ProductDetail';
import MyAuctions from './components/MyAuctions';
import MyPurchases from './components/MyPurchases';
import BidHistory from './components/BidHistory';
import ChatList from './components/ChatList';
import Chat from './components/Chat';
import NotFound from './components/NotFound';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Import the UserProvider
import { UserProvider } from './contexts/UserContext';

const queryClient = new QueryClient();

// Define a custom theme or use the default
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const isAuthenticated = () => {
  return localStorage.getItem('access_token') ? true : false;
};

const PrivateRoute = ({ element: Element, ...rest }) => {
  return isAuthenticated() ? <Element /> : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {/* Add UserProvider to wrap all components */}
        <UserProvider>
          <Router>
            <div className="App">
              {/* Navigation Bar */}
              <NavBar />

              {/* Define Routes */}
              <Routes>
                {/* Home Page */}
                <Route path="/" element={<Home />} />
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
                <Route path="/my-auctions" element={<PrivateRoute element={MyAuctions} />} />
                <Route path="/chat/:ownerUsername" element={<PrivateRoute element={Chat} />} />

                {/* Catch-All Route for 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Toast Notifications */}
              <ToastContainer />
            </div>
          </Router>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
