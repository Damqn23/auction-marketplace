// src/components/Chat.js

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadMessages,
} from '../services/auctionService';
import { UserContext } from '../contexts/UserContext'; 
import styles from './Chat.module.css';

const Chat = () => {
  const { ownerUsername } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, setUnreadCount } = useContext(UserContext);
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages when the component mounts or ownerUsername changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Get the messages
        const response = await getMessages(ownerUsername);
        setMessages(response);
        setLoading(false);

        // 2) Mark them as read on the server
        await markAsRead(ownerUsername);

        // 3) Update the unread count globally
        const unreadResponse = await getUnreadMessages();
        setUnreadCount(unreadResponse.unread_count);

        // 4) Scroll to the latest message
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages', error);
        setLoading(false);
      }
    };

    fetchData();
    // List dependencies. If `setUnreadCount` or `ownerUsername` changes, we refetch.
  }, [ownerUsername, setUnreadCount]);

  // Send a new message
  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return; // Avoid sending empty messages

    try {
      const sentMessage = await sendMessage(ownerUsername, trimmed);
      setNewMessage(''); // Clear input field

      // Append the new message to our existing list
      const updatedMessages = [...messages, sentMessage];
      setMessages(updatedMessages);

      scrollToBottom(); // Scroll to the latest message
    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading chat...</div>;
  }

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
                className={`${styles.message} ${
                  isSentByCurrentUser ? styles.sent : styles.received
                }`}
              >
                <div className={styles.messageContent}>
                  <strong>{msg.sender.username}</strong>
                  <p>{msg.message}</p>
                  <span className={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
        <button onClick={handleSendMessage} className={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
