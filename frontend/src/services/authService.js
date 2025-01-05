// frontend/src/services/authService.js

import axiosInstance from './axiosConfig';

// Function to handle user login
export const loginUser = async (username, password) => {
    try {
        const response = await axiosInstance.post('token/', {
            username,
            password,
        });
        // Store tokens
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Function to handle user registration
export const registerUser = async (userData) => {
    try {
        const response = await axiosInstance.post('register/', userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Function to handle token refreshing
export const refreshToken = async () => {
    try {
        const response = await axiosInstance.post('token/refresh/', {
            refresh: localStorage.getItem('refresh_token'),
        });
        localStorage.setItem('access_token', response.data.access);
        return response.data;
    } catch (error) {
        throw error;
    }
};
