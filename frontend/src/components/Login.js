import React, { useState, useContext } from 'react';
import { loginUser } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // For toast notifications
import styles from './Login.module.css';   // Import CSS Module
import { UserContext } from '../contexts/UserContext'; // Import UserContext
import { getCurrentUser } from '../services/userService'; // Import getCurrentUser

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { setUser } = useContext(UserContext); // Access setUser to update context

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await loginUser(username, password);
            toast.success('Logged in successfully!');
            // Fetch and set the current user
            const userData = await getCurrentUser();
            setUser(userData);
            navigate('/'); // Redirect to home after login
        } catch (err) {
            console.error('Login error:', err);
            setError('Invalid username or password.');
            toast.error('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className={styles.container}>
            <h2>Login</h2>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <button type="submit" className={styles.button}>Login</button>
            </form>
            <p style={{ marginTop: '10px' }}>
                Don't have an account? <Link to="/register">Register here</Link>.
            </p>
        </div>
    );
};

export default Login;
