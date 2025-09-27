// src/services/notificationService.js

import axiosInstance from './axiosConfig';

// Get all notifications for the current user
export const getAllNotifications = async () => {
    try {
        const response = await axiosInstance.get('notifications/');
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

// Get unread notification count
export const getUnreadNotificationCount = async () => {
    try {
        const response = await axiosInstance.get('notifications/unread_count/');
        return response.data;
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        throw error;
    }
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
    try {
        const response = await axiosInstance.post('notifications/mark_all_read/');
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

// Mark a specific notification as read
export const markNotificationRead = async (notificationId) => {
    try {
        const response = await axiosInstance.post(`notifications/${notificationId}/mark_read/`);
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};