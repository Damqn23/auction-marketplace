import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
import Deposit from './components/Deposit';
import BidHistory from './components/BidHistory';
import ChatList from './components/ChatList';
import BidStatusNotifier from "./components/BidStatusNotifier";
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

// Theme configuration
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode colors
          primary: {
            main: '#7873f5',
            light: '#9c98f7',
            dark: '#5c57c3',
          },
          secondary: {
            main: '#ff6ec4',
            light: '#ff8ed3',
            dark: '#cc58a0',
          },
          background: {
            default: '#f0f4f8',
            paper: '#ffffff',
          },
        }
      : {
          // Dark mode colors
          primary: {
            main: '#9c98f7',
            light: '#bdbaf9',
            dark: '#7873f5',
          },
          secondary: {
            main: '#ff8ed3',
            light: '#ffaee2',
            dark: '#ff6ec4',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  },
});

function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserProvider>
          <Router>
            <div className="App">
              <NavBar />
              <BidStatusNotifier />
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
                <Route path="/deposit" element={<PrivateRoute element={Deposit} />}/>
                <Route path="/favorites" element={<PrivateRoute element={Favorites} />} />
                <Route path="/dashboard" element={<PrivateRoute element={Dashboard} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={mode}
              />
            </div>
          </Router>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
