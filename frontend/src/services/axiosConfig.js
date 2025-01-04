// frontend/src/services/axiosConfig.js

import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Optional: Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response.status === 401 &&
            !originalRequest._retry &&
            localStorage.getItem('refresh_token')
        ) {
            originalRequest._retry = true;
            try {
                const response = await axiosInstance.post('token/refresh/', {
                    refresh: localStorage.getItem('refresh_token'),
                });
                localStorage.setItem('access_token', response.data.access);
                axiosInstance.defaults.headers.common['Authorization'] =
                    'Bearer ' + response.data.access;
                return axiosInstance(originalRequest);
            } catch (err) {
                console.error('Token refresh failed:', err);
                // Optionally, redirect to login
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
