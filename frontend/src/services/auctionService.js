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
export const searchAuctionItems = async (query) => {
    try {
        console.log(`Searching auction items with query: ${query}`); // Debugging line
        const response = await axiosInstance.get(
            `auction-items/search/?q=${encodeURIComponent(query)}`
        );
        console.log(response.data); // Log response for debugging
        return response.data;
    } catch (error) {
        console.error('Error searching auction items:', error);
        throw error;
    }
};

// Get auction item by ID
export const getAuctionItem = async (id) => {
    try {
        console.log(`Fetching item with ID: ${id}`); // Debugging line
        const response = await axiosInstance.get(`auction_items/${id}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getUnreadMessages = async () => {
    try {
        const response = await axiosInstance.get('chat/unread_count/');
        return response.data;
    } catch (error) {
        console.error('Error fetching unread messages count:', error);
        throw error;
    }
};

export const sendMessage = async (recipientUsername, message) => {
    try {
        const response = await axiosInstance.post('chat/send_message/', {
            recipient_username: recipientUsername,
            message: message,
        });
        return response.data; // Ensure this returns the message object with sender.username
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const getMessages = async (otherUsername = null) => {
    try {
        const params = otherUsername ? { other_username: otherUsername } : {};
        const response = await axiosInstance.get('chat/get_messages/', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

export const getChats = async () => {
    try {
        const response = await axiosInstance.get('chat/get_chats/');
        return response.data;
    } catch (error) {
        console.error('Error fetching chats:', error);
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
export const markAsRead = async (otherUsername = null) => {
    try {
        const data = otherUsername ? { other_username: otherUsername } : {};
        const response = await axiosInstance.post('chat/mark_as_read/', data);
        return response.data;
    } catch (error) {
        console.error('Error marking messages as read:', error);
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