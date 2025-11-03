import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import EmojiPicker from "emoji-picker-react";

import {
  getMessages,
  markAsRead,
  getUnreadMessages,
} from "../services/auctionService";
import { UserContext } from "../contexts/UserContext";

function formatMessageDate(timestamp) {
  const messageDate = new Date(timestamp);
  const now = new Date();
  if (messageDate.toDateString() === now.toDateString()) {
    return "Today";
  }
  return messageDate.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

const Chat = () => {
  const { ownerUsername } = useParams();
  const { user, setUnreadCount } = useContext(UserContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const ws = useRef(null);

  // Determine room name
  const chatRoomName =
    user.username < ownerUsername
      ? user.username + "_" + ownerUsername
      : ownerUsername + "_" + user.username;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1) Load messages via REST
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

  // 2) Open WebSocket
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${process.env.REACT_APP_WEBSOCKET_URL}/ws/chat/${chatRoomName}/?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "chat_message") {
        // Append the new message
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      } else if (data.type === "typing") {
        // Only show typing if it's from the OTHER user
        if (data.sender !== user.username) {
          setOtherUserTyping(true);
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.current.close();
    };
  }, [chatRoomName, user.username]);

  // 3) Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 4) Send a chat message
  const handleSendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const messageData = {
      type: "chat_message",
      message: trimmed,
      sender: user.username,
      recipient: ownerUsername,
      timestamp: new Date().toISOString(),
    };

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(messageData));
      setNewMessage("");
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  // 5) Send "typing" event on text change
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const typingData = {
        type: "typing",
        sender: user.username,
        recipient: ownerUsername,
      };
      ws.current.send(JSON.stringify(typingData));
    }
  };

  // 6) Emoji picker
  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  // If still loading
  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography>Loading chat...</Typography>
      </Box>
    );
  }

  let currentDay = null;

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
        Your Chats
      </Typography>
      
      {/* Top Bar */}
      <Box
        sx={{
          background: "linear-gradient(45deg, #2196F3, #64B5F6)",
          color: "#fff",
          py: 2,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            letterSpacing: 1,
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          Chat with {ownerUsername}
        </Typography>
      </Box>

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.length === 0 ? (
          <Typography
            variant="body1"
            sx={{ fontStyle: "italic", color: "#666", textAlign: "center", mt: 2 }}
          >
            No messages yet.
          </Typography>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.sender === user.username;
            const messageDay = msg.timestamp
              ? new Date(msg.timestamp).toDateString()
              : null;

            let showDateHeader = false;
            if (messageDay && messageDay !== currentDay) {
              showDateHeader = true;
              currentDay = messageDay;
            }

            return (
              <React.Fragment key={index}>
                {/* Date Header */}
                {showDateHeader && msg.timestamp && (
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: "center",
                      mt: 2,
                      mb: 1,
                      color: "#888",
                      fontWeight: "bold",
                    }}
                  >
                    {formatMessageDate(msg.timestamp)}
                  </Typography>
                )}

                {/* Message Bubble */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isCurrentUser ? "flex-end" : "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "75%",
                      p: 1.5,
                      borderRadius: 3,
                      fontSize: "1rem",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      backgroundColor: isCurrentUser ? "#1976D2" : "#fff",
                      color: isCurrentUser ? "#fff" : "#333",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "bold",
                        mb: 0.5,
                        color: isCurrentUser ? "#fff" : "#333",
                      }}
                    >
                      {msg.sender}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {msg.message}
                    </Typography>
                    {msg.timestamp && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          textAlign: "right",
                          color: isCurrentUser
                            ? "rgba(255,255,255,0.8)"
                            : "#777",
                          mt: 0.5,
                          fontSize: "0.8rem",
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </React.Fragment>
            );
          })
        )}
        <Box ref={messagesEndRef} />

        {/* Typing Indicator */}
        {otherUserTyping && (
          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", color: "#666", mt: 1, textAlign: "left" }}
          >
            {ownerUsername} is typing...
          </Typography>
        )}
      </Box>

      {/* Input Area (Footer) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1,
          borderTop: "1px solid #ddd",
          backgroundColor: "#fff",
          position: "relative",
        }}
      >
        {/* Emoji Picker Toggle */}
        <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <InsertEmoticonIcon sx={{ color: "#1976D2" }} />
        </IconButton>

        {showEmojiPicker && (
          <Box
            sx={{
              position: "absolute",
              bottom: "60px",
              left: "10px",
              zIndex: 10,
            }}
          >
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleTyping}
          sx={{
            mx: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: "#f9f9f9",
            },
          }}
        />

        <IconButton
          onClick={handleSendMessage}
          sx={{
            backgroundColor: "#1976D2",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#1565C0",
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chat;
