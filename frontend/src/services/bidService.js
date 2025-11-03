import axiosInstance from './axiosConfig';

// Fetch bids for the authenticated user (server-side filtered)
export const getUserBids = async () => {
    try {
        const response = await axiosInstance.get('bids/');
        return response;
    } catch (error) {
        throw error;
    }
};
