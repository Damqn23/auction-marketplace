// frontend/src/components/NavBar.js

import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './NavBar.module.css'; // Import CSS Module
import { UserContext } from '../contexts/UserContext'; // Import UserContext
import { toast } from 'react-toastify'; // Import toast for notifications

const NavBar = () => {
    const { user, setUser } = useContext(UserContext); // Access user and setUser from context
    const navigate = useNavigate(); // Initialize navigate function

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null); // Update user state in context
        toast.success('Logged out successfully!');
        navigate('/login'); // Redirect to login page after logout
    };

    return (
        <nav className={styles.navbar}>
            <Link to="/" className={styles.logo}>Auction Marketplace</Link>
            <div className={styles.navLinks}>
                {user ? (
                    <>
                        <Link to="/create" className={styles.navLink}>Create Auction</Link>
                        <Link to="/my-bids" className={styles.navLink}>My Bids</Link> {/* Optional: Add My Bids link */}
                        <Link to="/my-purchases" className={styles.navLink}>My Purchases</Link> {/* New Link */}
                        <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className={styles.navLink}>Login</Link>
                        <Link to="/register" className={styles.navLink}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default NavBar;
