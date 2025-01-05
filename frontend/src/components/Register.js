import React, { useState } from 'react';
import { registerUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // For toast notifications
import styles from './Register.module.css'; // Import CSS Module

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
            await registerUser({ username, email, first_name: firstName, last_name: lastName, password, password2 });
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
        <div className={styles.container}>
            <h2>Register</h2>
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
                    <label className={styles.label}>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>First Name:</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={styles.input}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Last Name:</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
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
                <div className={styles.formGroup}>
                    <label className={styles.label}>Confirm Password:</label>
                    <input
                        type="password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <button type="submit" className={styles.button}>Register</button>
            </form>
        </div>
    );
};

export default Register;
