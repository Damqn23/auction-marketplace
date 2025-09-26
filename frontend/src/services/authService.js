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
        const payload = {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            password2: userData.confirmPassword, // must match backend
            first_name: "",  // optional
            last_name: "",   // optional
        };
        const response = await axiosInstance.post("register/", payload);
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
