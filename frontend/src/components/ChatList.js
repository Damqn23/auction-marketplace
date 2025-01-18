// frontend/src/components/ChatList.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getChats } from '../services/auctionService';
import styles from './ChatList.module.css';

import {
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Typography,
    Badge,
    CircularProgress,
    Paper,
    Divider,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

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

    if (loading) return (
        <div className={styles.loaderContainer}>
            <CircularProgress />
        </div>
    );

    return (
        <Paper className={styles.chatListContainer} elevation={3}>
            <Typography variant="h5" className={styles.header}>
                Your Chats
            </Typography>
            <Divider />
            <List className={styles.chatList}>
                {chats.length === 0 ? (
                    <Typography variant="body1" className={styles.noChats}>
                        No conversations yet. Start chatting now!
                    </Typography>
                ) : (
                    chats.map((chat, index) => (
                        <Link to={`/chat/${chat.owner}`} key={index} className={styles.chatLink}>
                            <ListItem button className={styles.chatItem}>
                                <ListItemAvatar>
                                    <Badge
                                        badgeContent={chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                                        color="error"
                                        invisible={chat.unreadCount === 0}
                                        anchorOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                    >
                                        <Avatar alt={chat.owner} src={chat.avatarUrl}>
                                            {chat.owner.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" className={styles.chatOwner}>
                                            {chat.owner}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="body2" className={styles.lastMessage}>
                                            {chat.lastMessage}
                                        </Typography>
                                    }
                                />
                                <ChatIcon className={styles.chatIcon} />
                            </ListItem>
                        </Link>
                    ))
                )}
            </List>
        </Paper>
    );
};

export default ChatList;
