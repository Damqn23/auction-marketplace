// frontend/src/services/userService.js

import axiosInstance from './axiosConfig';

export const getCurrentUser = async () => {
    try {
        const response = await axiosInstance.get('users/me/'); // Endpoint to fetch current user
        return response.data;
    } catch (error) {
        throw error;
    }
};
