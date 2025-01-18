// src/components/NotFound.js

import React from 'react';
import { Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFound = () => (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Typography variant="h3" gutterBottom>
            404 - Page Not Found
        </Typography>
        <Typography variant="body1" gutterBottom>
            Oops! The page you're looking for doesn't exist.
        </Typography>
        <Button variant="contained" color="primary" component={Link} to="/">
            Go to Home
        </Button>
    </div>
);

export default NotFound;
