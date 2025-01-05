// src/services/auctionService.js

import axiosInstance from './axiosConfig';

// Get all auction items
export const getAllAuctionItems = () => {
    return axiosInstance.get('auction-items/');
};

// Get auction item by ID
export const getAuctionItem = (id) => {
    return axiosInstance.get(`auction-items/${id}/`);
};

// Create a new auction item
export const createAuctionItem = async (formData) => {
    try {
        const response = await axiosInstance.post('auction-items/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // For file uploads
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Update an auction item
export const updateAuctionItem = async (auctionItemId, formData) => {
    try {
        const response = await axiosInstance.put(`auction-items/${auctionItemId}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // For file uploads
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Delete an auction item
export const deleteAuctionItem = (id) => {
    return axiosInstance.delete(`auction-items/${id}/`);
};

export const placeBid = async (auctionItemId, bidAmount) => {
    try {
        const response = await axiosInstance.post(`auction-items/${auctionItemId}/bid/`, {
            amount: bidAmount,
        }, {
            headers: {
                'Content-Type': 'application/json', // Ensure correct Content-Type
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};