// frontend/src/components/ChatList.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getChats } from '../services/auctionService';
import styles from './ChatList.module.css';

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all unique chats
    const fetchChats = async () => {
        try {
            const chats = await getChats();  // Get all unique chats for the logged-in user
            setChats(chats);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching chats", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    if (loading) return <div>Loading chats...</div>;

    return (
        <div className={styles.chatListContainer}>
            <h2>Your Chats</h2>
            <div className={styles.chatList}>
                {chats.length === 0 ? (
                    <p>No conversations yet.</p>
                ) : (
                    chats.map((chat, index) => (
                        <div key={index} className={styles.chatItem}>
                            <Link to={`/chat/${chat.owner}`} className={styles.chatLink}>
                                <p>{chat.owner}</p>
                                <p className={styles.lastMessage}>{chat.lastMessage}</p>
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatList;
