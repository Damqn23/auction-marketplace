// src/contexts/UserContext.js

import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/userService';
import { getUnreadMessages } from '../services/auctionService';
import { toast } from 'react-toastify';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAndUnreadMessages = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    // Fetch the current user
                    const userData = await getCurrentUser();
                    setUser(userData);

                    // Fetch unread messages count
                    const unreadResponse = await getUnreadMessages();
                    setUnreadCount(unreadResponse.unread_count);
                } catch (error) {
                    console.error('Error fetching user or unread messages:', error);
                    // Only show toast if it's not a 401 (which means invalid/expired token)
                    if (error.response?.status !== 401) {
                        toast.error('Failed to fetch user data or unread messages.');
                    }

                    // Log the user out if fetching fails
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                    setUnreadCount(0);
                }
            } else {
                // If no token is found, ensure user is null and unreadCount is 0
                setUser(null);
                setUnreadCount(0);
            }
            setLoading(false);
        };

        fetchUserAndUnreadMessages();
    }, []);

    // Function to refresh unread messages, can be called after viewing messages
    const refreshUnreadCount = async () => {
        if (user) {
            try {
                const unreadResponse = await getUnreadMessages();
                setUnreadCount(unreadResponse.unread_count);
            } catch (error) {
                console.error("Error fetching unread message count:", error);
            }
        } else {
            setUnreadCount(0);
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser, unreadCount, setUnreadCount, refreshUnreadCount }}>
            {!loading && children}
        </UserContext.Provider>
    );
};
