import React, { useState } from 'react';
import { registerUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './Register.module.css';

// Material UI imports
import {
    Paper,
    Typography,
    TextField,
    Button,
    Box
} from '@mui/material';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic form validation
        if (password !== password2) {
            setError("Passwords don't match.");
            toast.error("Passwords don't match.");
            return;
        }

        try {
            await registerUser({
                username,
                email,
                first_name: firstName,
                last_name: lastName,
                password,
                password2
            });
            toast.success('Registration successful! You can now log in.');
            navigate('/login'); // Redirect to login page after successful registration
        } catch (err) {
            console.error('Registration error:', err);
            if (err.response && err.response.data) {
                const errorMessages = Object.values(err.response.data).flat();
                errorMessages.forEach((msg) => toast.error(msg));
            } else {
                toast.error('Registration failed. Please try again.');
            }
        }
    };

    return (
        <div className={styles.wrapper}>
            <Paper elevation={2} className={styles.container}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Register
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
                            label="Email"
                            variant="outlined"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            required
                        />
                    </Box>

                    <Box mb={2}>
                        <TextField
                            label="First Name"
                            variant="outlined"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            fullWidth
                        />
                    </Box>

                    <Box mb={2}>
                        <TextField
                            label="Last Name"
                            variant="outlined"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            fullWidth
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

                    <Box mb={3}>
                        <TextField
                            label="Confirm Password"
                            variant="outlined"
                            type="password"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
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
                        Register
                    </Button>
                </form>
            </Paper>
        </div>
    );
};

export default Register;
