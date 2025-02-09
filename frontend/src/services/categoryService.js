import axiosInstance from "./axiosConfig";

export const getAllCategories = async () => {
    try{
        const response = await axiosInstance.get('categories/')
        return response.data;
    } catch(error){
        console.error('Error fetching categories:', error);
        throw error;
    }
};