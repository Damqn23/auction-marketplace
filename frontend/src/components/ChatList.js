import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getChats } from "../services/auctionService";
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
  Box,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { useTranslation } from 'react-i18next';

const ChatList = () => {
  const { t } = useTranslation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const chats = await getChats();
      console.log("Chats response:", chats);
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

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 1, sm: 2 },
        mt: { xs: '64px', sm: '72px' },
        pt: { xs: 2, sm: 3 },
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: "bold",
          color: "primary.main",
        }}
      >
        Messages
      </Typography>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          maxWidth: "800px",
          mx: "auto",
          my: 4,
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            color: "#283593",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Your Chats
        </Typography>
        <Divider />
        <List
          sx={{
            maxHeight: "600px",
            overflowY: "auto",
            p: 0,
          }}
        >
          {chats.length === 0 ? (
            <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                color: "#888",
                mt: 2,
                fontSize: "1rem",
              }}
            >
              No conversations yet. Start chatting now!
            </Typography>
          ) : (
            chats.map((chat, index) => (
              <Link
                to={`/chat/${chat.owner}`}
                key={index}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <ListItem
                  button
                  sx={{
                    transition: "background-color 0.3s ease",
                    "&:hover": { backgroundColor: "#f1f1f1" },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                      color="error"
                      invisible={chat.unreadCount === 0}
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                    >
                      <Avatar alt={chat.owner} src={chat.avatarUrl}>
                        {chat.owner.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: "#283593",
                          fontWeight: 600,
                          fontSize: { xs: "1rem", sm: "1.1rem" },
                        }}
                      >
                        {chat.owner}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#555",
                          fontSize: { xs: "0.8rem", sm: "0.9rem" },
                          mt: 0.5,
                        }}
                      >
                        {chat.lastMessage}
                      </Typography>
                    }
                  />
                  <ChatIcon
                    sx={{
                      color: "#1976d2",
                      display: { xs: "none", sm: "block" },
                    }}
                  />
                </ListItem>
                <Divider />
              </Link>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default ChatList;
