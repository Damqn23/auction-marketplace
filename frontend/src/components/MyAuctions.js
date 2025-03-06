import React, { useEffect, useState, useContext } from "react";
import { getMyAuctions, markAsShipped } from "../services/auctionService";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import {
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Container,
  Box,
  Pagination,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import { Link } from "react-router-dom";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const MyAuctions = () => {
  const { user } = useContext(UserContext);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Separate fetch function so we can reuse on "Retry"
  const fetchMyAuctionsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyAuctions();
      if (!Array.isArray(data)) {
        setError("Unexpected data format received.");
        return;
      }
      // Sort by newest based on created_at
      data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setAuctions(data);
    } catch (err) {
      console.error("Failed to load auctions:", err);
      const detail = err.response?.data?.detail || "Failed to load auctions.";
      setError(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("You must be logged in to view your auctions.");
      return;
    }
    fetchMyAuctionsData();
  }, [user]);

  const handleMarkShipped = async (auctionId) => {
    try {
      await markAsShipped(auctionId);
      toast.success("Item marked as shipped!");
      setAuctions((prev) =>
        prev.map((auction) =>
          auction.id === auctionId ? { ...auction, shipping_status: "shipped" } : auction
        )
      );
    } catch (error) {
      console.error("Error marking item as shipped:", error);
      toast.error(error.response?.data?.detail || "Error marking as shipped");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          textAlign: "center",
          color: "#555",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          Loading your auctions...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchMyAuctionsData}>
          Retry
        </Button>
      </Box>
    );
  }

  // Pagination logic
  const paginatedAuctions = auctions.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const pageCount = Math.ceil(auctions.length / itemsPerPage);

  return (
    <Container
      maxWidth="lg"
      sx={{
        p: 2,
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        animation: `${fadeIn} 1s ease-in-out`,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 2,
          fontWeight: "bold",
          color: "#333",
          textShadow: "1px 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        My Auctions
      </Typography>
      {auctions.length > 0 ? (
        <>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {paginatedAuctions.map((auction) => (
              <Grid item xs={12} sm={6} md={4} key={auction.id}>
                <Card
                  sx={{
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0px 4px 8px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  {auction.images && auction.images.length > 0 ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={auction.images[0].image}
                      alt={auction.title}
                      sx={{
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: "200px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #6a11cb, #2575fc)",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        No image available
                      </Typography>
                    </Box>
                  )}

                  <CardContent sx={{ p: 1.5, animation: `${slideUp} 0.5s ease-out` }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: "#333" }}>
                      {auction.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" noWrap sx={{ mb: 1 }}>
                      {auction.description.length > 100
                        ? `${auction.description.substring(0, 100)}...`
                        : auction.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: "0.9rem", color: "#555" }}>
                      <strong>Starting Bid:</strong> ${auction.starting_bid}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: "0.9rem", color: "#555" }}>
                      <strong>Current Bid:</strong> ${auction.current_bid || "N/A"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        color: auction.status === "active" ? "primary.main" : "error.main",
                      }}
                    >
                      <strong>Status:</strong> {auction.status}
                    </Typography>

                    {auction.status === "closed" && auction.shipping_status === "not_shipped" && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => handleMarkShipped(auction.id)}
                      >
                        Mark Shipped
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      color="primary"
                      component={Link}
                      to={`/auction/${auction.id}`}
                      sx={{
                        mt: 1,
                        textTransform: "none",
                        fontSize: "0.8rem",
                        transition: "background-color 0.3s ease, transform 0.3s ease",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                          transform: "scale(1.02)",
                        },
                      }}
                    >
                      View Auction
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ mt: 3, textAlign: "center", color: "#777" }}>
          You have not posted any auctions yet.
        </Typography>
      )}
    </Container>
  );
};

export default MyAuctions;
