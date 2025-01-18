// src/components/NavBar.js

import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import { getUnreadMessages } from '../services/auctionService';
import styles from './NavBar.module.css';

// Material UI imports
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Stack,
    TextField,
    IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const NavBar = () => {
    const { user, setUser, unreadCount, setUnreadCount } = useContext(UserContext);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUnreadMessages = async () => {
            try {
                const response = await getUnreadMessages();
                setUnreadCount(response.unread_count);
            } catch (error) {
                console.error("Error fetching unread message count", error);
            }
        };

        if (user) {
            fetchUnreadMessages();
        }
    }, [user, setUnreadCount]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setUnreadCount(0); // Reset unread count on logout
        toast.success('Logged out successfully!');
        navigate('/login');
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            navigate(`/auction-list?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleSearchButtonClick = () => {
        if (searchQuery.trim() !== '') {
            navigate(`/auction-list?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <AppBar position="static">
            <Toolbar className={styles.navbar}>
                <Stack direction="row" spacing={2} alignItems="center">
                    {/* Brand / Logo */}
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/"
                        className={styles.logo}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        Auction Marketplace
                    </Typography>

                    {/* Search Bar */}
                    <TextField
                        placeholder="Search items..."
                        size="small"
                        variant="outlined"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={handleSearchButtonClick}>
                                    <SearchIcon />
                                </IconButton>
                            ),
                        }}
                    />

                    {/* Navigation Links */}
                    {user ? (
                        <>
                            <Typography variant="body1" className={styles.navUsername}>
                                Hi, {user.username}!
                            </Typography>
                            <Button
                                component={Link}
                                to="/create"
                                color="inherit"
                                className={styles.navLink}
                            >
                                Create Auction
                            </Button>
                            <Button
                                component={Link}
                                to="/my-bids"
                                color="inherit"
                                className={styles.navLink}
                            >
                                My Bids
                            </Button>
                            <Button
                                component={Link}
                                to="/my-purchases"
                                color="inherit"
                                className={styles.navLink}
                            >
                                My Purchases
                            </Button>

                            {/* Chat button */}
                            <Button
                                component={Link}
                                to="/chat"
                                color="inherit"
                                className={styles.navLink}
                            >
                                Chat
                                {unreadCount > 0 && (
                                    <span className="notification-badge">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </Button>

                            <Button
                                onClick={handleLogout}
                                color="inherit"
                                className={styles.logoutButton}
                            >
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                component={Link}
                                to="/login"
                                color="inherit"
                                className={styles.navLink}
                            >
                                Login
                            </Button>
                            <Button
                                component={Link}
                                to="/register"
                                color="inherit"
                                className={styles.navLink}
                            >
                                Register
                            </Button>
                        </>
                    )}
                </Stack>
            </Toolbar>
        </AppBar>
    );
};

export default NavBar;
