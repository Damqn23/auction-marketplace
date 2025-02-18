import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadMessages,
} from "../services/auctionService";
import { UserContext } from "../contexts/UserContext";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

const Chat = () => {
  const { ownerUsername } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, setUnreadCount } = useContext(UserContext);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getMessages(ownerUsername);
        setMessages(response);
        setLoading(false);

        await markAsRead(ownerUsername);
        const unreadResponse = await getUnreadMessages();
        setUnreadCount(unreadResponse.unread_count);

        scrollToBottom();
      } catch (error) {
        console.error("Error fetching messages", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [ownerUsername, setUnreadCount]);

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return; // Avoid sending empty messages

    try {
      const sentMessage = await sendMessage(ownerUsername, trimmed);
      setNewMessage(""); // Clear input field
      setMessages((prev) => [...prev, sentMessage]);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  if (loading)
    return (
      <Box
        sx={{
          color: "#fff",
          fontSize: "1.2rem",
          textAlign: "center",
          p: 3,
        }}
      >
        Loading chat...
      </Box>
    );

  return (
    <Box
      sx={{
        p: 4,
        maxWidth: "800px",
        mx: "auto",
        my: 4,
        background: "linear-gradient(135deg, #6e7fce, #4a90e2)",
        borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        color: "#fff",
      }}
    >
      <Typography
        variant="h2"
        sx={{
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: 600,
          mb: 2,
          textShadow: "2px 2px 5px rgba(0, 0, 0, 0.1)",
        }}
      >
        Chat with {ownerUsername}
      </Typography>

      <Box
        sx={{
          height: { xs: 300, md: 400 },
          overflowY: "auto",
          mb: 3,
          p: 2,
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.1)",
          color: "#333",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.length === 0 ? (
          <Typography
            variant="body1"
            sx={{
              fontStyle: "italic",
              color: "#ccc",
              textAlign: "center",
              mt: 2,
            }}
          >
            No messages yet.
          </Typography>
        ) : (
          messages.map((msg) => {
            // Since our serializer returns sender as a string,
            // we can directly compare it with user.username.
            const isSentByCurrentUser = msg.sender === user.username;
            return (
              <Box
                key={msg.id}
                sx={{
                  alignSelf: isSentByCurrentUser ? "flex-end" : "flex-start",
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: isSentByCurrentUser ? "#d1f8d1" : "#fff9c4",
                  color: "inherit",
                  maxWidth: "70%",
                  textAlign: isSentByCurrentUser ? "right" : "left",
                }}
              >
                <Typography variant="subtitle2" component="span">
                  {msg.sender}
                </Typography>
                <Typography variant="body1" sx={{ my: 0.5 }}>
                  {msg.message}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.75rem",
                    color: "#666",
                    display: "block",
                    textAlign: "right",
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            );
          })
        )}
        <Box ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 2,
        }}
      >
        <TextField
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          multiline
          rows={3}
          fullWidth
          sx={{
            mb: 2,
            backgroundColor: "#f5f5f5",
            borderRadius: 1,
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#ccc" },
              "&:hover fieldset": { borderColor: "#4a90e2" },
              "&.Mui-focused fieldset": { borderColor: "#4a90e2" },
            },
          }}
        />
        <Button
          onClick={handleSendMessage}
          variant="contained"
          sx={{
            backgroundColor: "#4a90e2",
            color: "#fff",
            px: 3,
            py: 1.5,
            borderRadius: 3,
            textTransform: "none",
            transition: "background-color 0.3s ease",
            "&:hover": { backgroundColor: "#357ab7" },
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;
