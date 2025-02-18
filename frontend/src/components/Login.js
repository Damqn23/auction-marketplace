import React, { useState, useContext } from "react";
import { loginUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../contexts/UserContext";
import { getCurrentUser } from "../services/userService";
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

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginUser(username, password);
      toast.success("Logged in successfully!");
      const userData = await getCurrentUser();
      setUser(userData);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid username or password.");
      toast.error("Login failed. Please check your credentials.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
        background: "linear-gradient(135deg, #dfe9f3, #ffffff)",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: "400px",
          p: 4,
          borderRadius: 2,
          animation: `${fadeInScale} 0.6s ease-in-out`,
          backgroundColor: "rgba(255, 255, 255, 0.98)",
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
          Login
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#1976d2" },
                  "&:hover fieldset": { borderColor: "#115293" },
                  "&.Mui-focused fieldset": { borderColor: "#0d47a1" },
                },
              }}
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#1976d2" },
                  "&:hover fieldset": { borderColor: "#115293" },
                  "&.Mui-focused fieldset": { borderColor: "#0d47a1" },
                },
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disableElevation
            sx={{
              mt: 2,
              textTransform: "none",
              fontSize: "1rem",
              py: 1.5,
              transition: "background-color 0.3s ease, transform 0.3s ease",
              "&:hover": {
                backgroundColor: "#0d47a1",
                transform: "scale(1.02)",
              },
            }}
          >
            Login
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "#1976d2", textDecoration: "none", fontWeight: 500 }}
          >
            Register here
          </Link>
          .
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
