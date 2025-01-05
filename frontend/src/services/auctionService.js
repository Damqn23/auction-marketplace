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
export const createAuctionItem = (auctionData) => {
    return axiosInstance.post('auction-items/', auctionData, {
        headers: {
            'Content-Type': 'multipart/form-data', // Necessary for file uploads
        },
    });
};

// Update an auction item
export const updateAuctionItem = (id, auctionData) => {
    return axiosInstance.put(`auction-items/${id}/`, auctionData, {
        headers: {
            'Content-Type': 'multipart/form-data', // Necessary for file uploads
        },
    });
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