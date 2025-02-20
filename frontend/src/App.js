import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css'; // <--- This is crucial
import Home from './components/Home';
import AuctionList from './components/AuctionList';
import CreateAuction from './components/CreateAuction';
import UpdateAuction from './components/UpdateAuction';
import Login from './components/Login';
import Register from './components/Register';
import NavBar from './components/NavBar';
import Favorites from './components/Favorites';
import ProductDetail from './components/ProductDetail';
import MyAuctions from './components/MyAuctions';
import MyPurchases from './components/MyPurchases';
import BidHistory from './components/BidHistory';
import ChatList from './components/ChatList';
import Chat from './components/Chat';
import MyBids from './components/MyBids';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from './contexts/UserContext';

const queryClient = new QueryClient();

const isAuthenticated = () => {
  return localStorage.getItem('access_token') ? true : false;
};

const PrivateRoute = ({ element: Element }) => {
  return isAuthenticated() ? <Element /> : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router>
          <div className="App">
            <NavBar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auction-list" element={<AuctionList />} />
              <Route path="/auction/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create" element={<PrivateRoute element={CreateAuction} />} />
              <Route path="/update/:id" element={<PrivateRoute element={UpdateAuction} />} />
              <Route path="/my-bids" element={<PrivateRoute element={MyBids} />} />
              <Route path="/my-bid-history" element={<PrivateRoute element={BidHistory} />} />
              <Route path="/my-purchases" element={<PrivateRoute element={MyPurchases} />} />
              <Route path="/chat" element={<PrivateRoute element={ChatList} />} />
              <Route path="/my-auctions" element={<PrivateRoute element={MyAuctions} />} />
              <Route path="/chat/:ownerUsername" element={<PrivateRoute element={Chat} />} />
              <Route path="/favorites" element={<PrivateRoute element={Favorites} />} />
              <Route path="/dashboard" element={<PrivateRoute element={Dashboard} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ToastContainer />
          </div>
        </Router>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
