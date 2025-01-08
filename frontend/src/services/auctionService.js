// src/services/auctionService.js

import axiosInstance from './axiosConfig';

// Get all auction items
// frontend/src/services/auctionService.js



export const getAllAuctionItems = async () => {
    try {
        const response = await axiosInstance.get('auction-items/');
        // If paginated, return response.data.results
        return response.data.results || response.data;
    } catch (error) {
        console.error('Error fetching auction items:', error);
        throw error;
    }
};

// Get auction item by ID
export const getAuctionItem = async (id) => {
    try {
        const response = await axiosInstance.get(`auction-items/${id}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Create a new auction item
export const createAuctionItem = async (formData) => {
    try {
        const response = await axiosInstance.post('auction-items/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating auction item:', error);
        throw error;
    }
};
// Update an auction item
export const updateAuctionItem = async (auctionItemId, formData) => {
    try {
        const response = await axiosInstance.patch(`auction-items/${auctionItemId}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating auction item:', error);
        throw error;
    }
};

// Delete an auction item
export const deleteAuctionItem = async (id) => {
    try {
        const response = await axiosInstance.delete(`auction-items/${id}/`);
        return response.data;
    } catch (error) {
        console.error('Error deleting auction item:', error);
        throw error;
    }
};

// Place a bid
export const placeBid = async ({ id, amount }) => {
    try {
        const response = await axiosInstance.post(`auction-items/${id}/bid/`, { amount });
        return response.data;
    } catch (error) {
        console.error('Error placing bid:', error);
        throw error;
    }
};

// Buy Now
export const buyNow = async (id) => {
    try {
        const response = await axiosInstance.post(`auction-items/${id}/buy_now/`);
        return response.data;
    } catch (error) {
        console.error('Error with Buy Now:', error);
        throw error;
    }
};

// Get My Purchases
export const getMyPurchases = async () => {
    try {
        const response = await axiosInstance.get('my-purchases/');
        return response.data;
    } catch (error) {
        console.error('Error fetching purchases:', error);
        throw error;
    }
};