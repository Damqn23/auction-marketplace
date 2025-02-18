import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { keyframes } from "@emotion/react";

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const MyBids = () => {
  const [bids, setBids] = useState({
    winning_now: [],
    won: [],
    losing_now: [],
    lost: [],
  });
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/my-bids/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setBids(response.data);
      })
      .catch((error) => {
        console.error("Error fetching bids:", error);
      });
  }, [token]);

  const renderBidCard = (item) => (
    <Box
      key={item.id}
      onClick={() => navigate(`/auction/${item.id}`)}
      sx={{
        backgroundColor: "var(--card-surface-color, #ffffff)",
        p: 2,
        borderRadius: 2,
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        },
      }}
    >
      {item.images && item.images.length > 0 ? (
        <Box
          component="img"
          src={item.images[0].image}
          alt={item.title}
          sx={{
            width: "100%",
            height: 200,
            objectFit: "cover",
            borderRadius: "8px 8px 0 0",
          }}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: 200,
            backgroundColor: "var(--no-image-bg, #e0e0e0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted-text-color, #666)",
            borderRadius: "8px 8px 0 0",
            fontSize: "0.9rem",
          }}
        >
          No image available
        </Box>
      )}
      <Typography
        variant="h6"
        sx={{
          mt: 1,
          mb: 0.5,
          fontSize: "1.2rem",
          color: "var(--text-color, #333)",
        }}
      >
        {item.title}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontSize: "1rem", color: "var(--muted-text-color, #888)" }}
      >
        Current Bid: ${item.current_bid}
      </Typography>
    </Box>
  );

  if (!bids) return null;

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        p: 2,
        backgroundColor: "var(--surface-color, #f9f9f9)",
        borderRadius: 2,
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        animation: `${fadeIn} 1s ease-in-out`,
      }}
    >
      <Typography
        variant="h3"
        sx={{
          textAlign: "center",
          fontSize: "2.5rem",
          mb: 2,
          color: "var(--text-color, #333)",
        }}
      >
        My Bids
      </Typography>
      <Button
        onClick={() => navigate("/my-bid-history")}
        sx={{
          display: "block",
          mx: "auto",
          mb: 3,
          p: 1,
          fontSize: "1rem",
          backgroundColor: "var(--primary-color, #1976d2)",
          color: "var(--text-color-reverse, #ffffff)",
          borderRadius: 1,
          textTransform: "none",
          transition: "background-color 0.3s ease",
          "&:hover": {
            backgroundColor: "var(--primary-hover-color, #125ea2)",
          },
        }}
      >
        View All Bid History
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: "1.8rem",
            color: "var(--section-title-color, #444)",
            mb: 1,
            borderBottom: "2px solid var(--primary-color, #1976d2)",
            pb: 0.5,
          }}
        >
          Winning Now
        </Typography>
        {bids.winning_now.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 2,
            }}
          >
            {bids.winning_now.map(renderBidCard)}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "var(--muted-text-color, #888)",
              fontStyle: "italic",
              textAlign: "center",
              mt: 1,
            }}
          >
            No current winning bids.
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: "1.8rem",
            color: "var(--section-title-color, #444)",
            mb: 1,
            borderBottom: "2px solid var(--primary-color, #1976d2)",
            pb: 0.5,
          }}
        >
          Won
        </Typography>
        {bids.won.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 2,
            }}
          >
            {bids.won.map(renderBidCard)}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "var(--muted-text-color, #888)",
              fontStyle: "italic",
              textAlign: "center",
              mt: 1,
            }}
          >
            No auctions won.
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: "1.8rem",
            color: "var(--section-title-color, #444)",
            mb: 1,
            borderBottom: "2px solid var(--primary-color, #1976d2)",
            pb: 0.5,
          }}
        >
          Losing Now (You Can Bid)
        </Typography>
        {bids.losing_now.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 2,
            }}
          >
            {bids.losing_now.map(renderBidCard)}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "var(--muted-text-color, #888)",
              fontStyle: "italic",
              textAlign: "center",
              mt: 1,
            }}
          >
            No current losing bids.
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: "1.8rem",
            color: "var(--section-title-color, #444)",
            mb: 1,
            borderBottom: "2px solid var(--primary-color, #1976d2)",
            pb: 0.5,
          }}
        >
          Lost
        </Typography>
        {bids.lost.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 2,
            }}
          >
            {bids.lost.map(renderBidCard)}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "var(--muted-text-color, #888)",
              fontStyle: "italic",
              textAlign: "center",
              mt: 1,
            }}
          >
            No lost auctions.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MyBids;
