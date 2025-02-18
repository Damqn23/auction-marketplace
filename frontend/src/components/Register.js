import React, { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { keyframes } from "@emotion/react";

const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("Passwords don't match.");
      toast.error("Passwords don't match.");
      return;
    }

    try {
      await registerUser({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password2,
      });
      toast.success("Registration successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response && err.response.data) {
        const errorMessages = Object.values(err.response.data).flat();
        errorMessages.forEach((msg) => toast.error(msg));
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ff9a9e, #fad0c4)",
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: "500px",
          p: 4,
          borderRadius: 2,
          animation: `${fadeInScale} 0.6s ease-in-out`,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{
            textAlign: "center",
            mb: 3,
            fontWeight: "bold",
            color: "#333",
          }}
        >
          Register
        </Typography>

        {error && (
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box mb={2}>
            <TextField
              label="Username"
              variant="outlined"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
            />
          </Box>

          <Box mb={2}>
            <TextField
              label="Email"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
          </Box>

          <Box mb={2}>
            <TextField
              label="First Name"
              variant="outlined"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
            />
          </Box>

          <Box mb={2}>
            <TextField
              label="Last Name"
              variant="outlined"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
            />
          </Box>

          <Box mb={2}>
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />
          </Box>

          <Box mb={3}>
            <TextField
              label="Confirm Password"
              variant="outlined"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              fullWidth
              required
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disableElevation
            sx={{
              textTransform: "none",
              fontSize: "1rem",
              py: 1.5,
              transition: "background-color 0.3s ease, transform 0.3s ease",
              "&:hover": {
                backgroundColor: "#1565c0",
                transform: "scale(1.02)",
              },
            }}
          >
            Register
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
