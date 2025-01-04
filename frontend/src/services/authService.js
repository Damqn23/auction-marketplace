// frontend/src/services/authService.js

import axiosInstance from './axiosConfig';

// Function to handle user login
export const loginUser = async (username, password) => {
    try {
        const response = await axiosInstance.post('token/', {
            username,
            password,
        });
        // Store tokens in localStorage or a secure storage solution
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        return response.data;
    } catch (error) {
        throw error;
    }
};
