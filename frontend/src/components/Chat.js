// src/components/Chat.js

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { sendMessage, getMessages, markAsRead, getUnreadMessages } from '../services/auctionService';
import { UserContext } from '../contexts/UserContext'; // Import UserContext
import styles from './Chat.module.css'; // Import the CSS

const Chat = () => {
    const { ownerUsername } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const { user, setUnreadCount } = useContext(UserContext); // Access user and setUnreadCount
    const messagesEndRef = useRef(null); // For auto-scrolling

    // Fetch messages function
    const fetchMessages = async () => {
        try {
            const response = await getMessages(ownerUsername); // Call the API to fetch messages with specific user
            setMessages(response);
            setLoading(false);

            // After fetching messages, mark them as read
            await markAsRead(ownerUsername);

            // Update the unread count
            const unreadResponse = await getUnreadMessages();
            setUnreadCount(unreadResponse.unread_count);

            scrollToBottom(); // Scroll to the latest message
        } catch (error) {
            console.error("Error fetching messages", error);
            setLoading(false);
        }
    };

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch messages when the component mounts or ownerUsername changes
    useEffect(() => {
        fetchMessages();
    }, [ownerUsername]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return; // Avoid sending empty messages

        try {
            // Send the new message
            const sentMessage = await sendMessage(ownerUsername, newMessage);
            setNewMessage(''); // Clear input field after sending

            // Update messages immediately after sending
            const updatedMessages = [...messages, sentMessage];
            setMessages(updatedMessages);
            scrollToBottom(); // Scroll to the latest message
        } catch (error) {
            console.error("Error sending message", error);
        }
    };

    if (loading) return <div className={styles.loadingState}>Loading chat...</div>; // Loading state

    return (
        <div className={styles.chatContainer}>
            <h2 className={styles.chatHeader}>Chat with {ownerUsername}</h2>
            <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                    <p className={styles.noMessages}>No messages yet.</p>
                ) : (
                    messages.map((msg) => {
                        const isSentByCurrentUser = msg.sender.username === user.username;
                        return (
                            <div
                                key={msg.id}
                                className={`${styles.message} ${isSentByCurrentUser ? styles.sent : styles.received}`}
                            >
                                <div className={styles.messageContent}>
                                    <strong>{msg.sender.username}</strong>
                                    <p>{msg.message}</p>
                                    {/* Optional: Display timestamp */}
                                    <span className={styles.timestamp}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputContainer}>
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                />
                <button onClick={handleSendMessage} className={styles.sendButton}>Send</button>
            </div>
        </div>
    );
};

export default Chat;
