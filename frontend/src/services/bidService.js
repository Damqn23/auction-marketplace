import axiosInstance from './axiosConfig';

// Function to fetch user bids
export const getUserBids = async (userId) => {
    try {
        const response = await axiosInstance.get(`bids/?bidder=${userId}`); // Adjust endpoint as needed
        return response;
    } catch (error) {
        throw error;
    }
};
