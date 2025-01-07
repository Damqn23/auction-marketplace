// frontend/src/services/axiosConfig.js

import axios from 'axios';
import { refreshToken } from './authService';
import { toast } from 'react-toastify';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api/', // Adjust based on your backend URL and endpoint
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json', // Default to JSON
        accept: 'application/json',
    },

});

// Add a request interceptor to include the JWT token in headers
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token refreshing
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                await refreshToken();
                const token = localStorage.getItem('access_token');
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            } catch (err) {
                toast.error('Session expired. Please log in again.');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
