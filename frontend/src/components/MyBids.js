import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Typography,
  TextField,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import { toast } from "react-toastify";
import moment from "moment";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import CountdownTimer from "./CountdownTimer";
import FavoriteButton from "./FavoriteButton";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const MyBids = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const queryClient = useQueryClient();

  // Use React Query to fetch bid data for the current user
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myBids"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:8000/api/my-bids/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    // Optionally, refetch every 5 seconds to get near-real-time updates:
    refetchInterval: 5000,
  });

  // Local state to track custom bid inputs per auction
  const [bidAmounts, setBidAmounts] = useState({});

  // Real bid mutation that calls your backend
  const bidMutation = useMutation({
    mutationFn: async ({ id, amount }) => {
      const response = await axios.post(
        `http://localhost:8000/api/auction-items/${id}/bid/`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myBids"]);
      toast.success("Bid placed successfully!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to place bid.");
    },
  });

  const handlePlaceBid = (auctionId, minRequiredBid) => {
    const amount = parseFloat(bidAmounts[auctionId]);
    if (isNaN(amount)) {
      toast.error("Please enter a valid bid amount.");
      return;
    }
    if (amount < minRequiredBid) {
      toast.error(`Bid must be at least $${minRequiredBid}`);
      return;
    }
    bidMutation.mutate({ id: auctionId, amount });
  };

  const navigateToAuction = (id) => {
    navigate(`/auction/${id}`);
  };

  // Render a bid card for each auction item in either "winning" or "losing" state.
  const renderBidCard = (item, isWinning) => {
    // Calculate minimum bid value: if there's a current bid, use that; otherwise, use starting bid.
    const minBidValue = item.current_bid
      ? parseFloat(item.current_bid)
      : parseFloat(item.starting_bid);
    const minIncrement = minBidValue * 0.02;
    const minRequiredBid = (minBidValue + minIncrement).toFixed(2);

    return (
      <Box
        key={item.id}
        onClick={() => navigateToAuction(item.id)}
        sx={{
          backgroundColor: "#ffffff",
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
              backgroundColor: "#e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <Typography variant="caption">No image available</Typography>
          </Box>
        )}
        <Typography
          variant="h6"
          sx={{ mt: 1, mb: 0.5, fontSize: "1.2rem", color: "#333" }}
        >
          {item.title}
        </Typography>
        <Typography variant="body1" sx={{ fontSize: "1rem", color: "#888" }}>
          Current Bid: ${item.current_bid || "No bids yet"}
        </Typography>
        {/* Display a colored label: green if winning, red if losing */}
        <Typography
          variant="caption"
          sx={{
            display: "inline-block",
            mt: 1,
            p: "2px 6px",
            borderRadius: "4px",
            backgroundColor: isWinning ? "#4caf50" : "#f44336",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          {isWinning ? "Winning" : "Losing"}
        </Typography>
        {/* For losing items, show a custom bid input and a real Bid button */}
        {!isWinning && (
          <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
            <TextField
              label={`Min: $${minRequiredBid}`}
              type="number"
              size="small"
              value={bidAmounts[item.id] || ""}
              onChange={(e) =>
                setBidAmounts({ ...bidAmounts, [item.id]: e.target.value })
              }
              sx={{ width: 130 }}
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handlePlaceBid(item.id, minRequiredBid);
              }}
              sx={{
                textTransform: "none",
                transition: "background-color 0.3s ease",
                "&:hover": {
                  backgroundColor: "#66bb6a",
                },
              }}
            >
              Bid
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (isError)
    return (
      <Typography sx={{ p: 2 }}>Failed to load bids.</Typography>
    );

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        p: 2,
        backgroundColor: "#f9f9f9",
        borderRadius: 2,
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        animation: `${fadeIn} 1s ease-in-out`,
      }}
    >
      <Typography
        variant="h3"
        sx={{ textAlign: "center", fontSize: "2.5rem", mb: 2, color: "#333" }}
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
          backgroundColor: "#1976d2",
          color: "#fff",
          borderRadius: 1,
          textTransform: "none",
          transition: "background-color 0.3s ease",
          "&:hover": { backgroundColor: "#125ea2" },
        }}
      >
        View All Bid History
      </Button>

      {/* Winning Now Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: "1.8rem",
            color: "#4caf50",
            mb: 1,
            borderBottom: "2px solid #4caf50",
            pb: 0.5,
          }}
        >
          Winning Now
        </Typography>
        {data.winning_now.length > 0 ? (
          <Grid container spacing={2}>
            {data.winning_now.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                {renderBidCard(item, true)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "#888",
              fontStyle: "italic",
              textAlign: "center",
              mt: 1,
            }}
          >
            No current winning bids.
          </Typography>
        )}
      </Box>

      {/* Losing Now Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: "1.8rem",
            color: "#f44336",
            mb: 1,
            borderBottom: "2px solid #f44336",
            pb: 0.5,
          }}
        >
          Losing Now (You Can Bid)
        </Typography>
        {data.losing_now.length > 0 ? (
          <Grid container spacing={2}>
            {data.losing_now.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                {renderBidCard(item, false)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "#888",
              fontStyle: "italic",
              textAlign: "center",
              mt: 1,
            }}
          >
            No current losing bids.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MyBids;
