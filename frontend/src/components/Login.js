import React, { useState, useContext } from 'react';
import { loginUser } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './Login.module.css';
import { UserContext } from '../contexts/UserContext';
import { getCurrentUser } from '../services/userService';

// Material UI imports
import { Paper, Typography, TextField, Button, Box } from '@mui/material';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);

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
        <div className={styles.wrapper}>
            <Paper elevation={3} className={styles.container}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Login
                </Typography>

                {error && (
                    <Typography variant="body1" color="error" className={styles.error}>
                        {error}
                    </Typography>
                )}

                <form onSubmit={handleSubmit}>
                    <Box mb={2}>
                        <TextField
                            label="Username"
                            variant="outlined"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            fullWidth
                            required
                        />
                    </Box>

                    <Box mb={2}>
                        <TextField
                            label="Password"
                            variant="outlined"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            required
                        />
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disableElevation
                    >
                        Login
                    </Button>
                </form>

                <Typography variant="body2" sx={{ marginTop: '10px' }}>
                    Don't have an account?{' '}
                    <Link to="/register" className={styles.link}>
                        Register here
                    </Link>
                    .
                </Typography>
            </Paper>
        </div>
    );
};

export default Login;
