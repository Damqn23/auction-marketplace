import React, { useState, useEffect, useContext } from "react";
import { getMyPurchases, markAsReceived } from "../services/auctionService";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Container,
  CircularProgress,
  Box,
  Pagination,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import { useTranslation } from 'react-i18next';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const MyPurchases = () => {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  // Separate function so we can call it on mount & on retry
  const fetchPurchasedItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyPurchases();
      // Safely parse data
      const items =
        (response?.data && Array.isArray(response.data) && response.data) ||
        (Array.isArray(response) && response) ||
        [];

      if (items.length === 0) {
        toast.warn("No purchases found.");
      }
      // Sort by newest purchase (using end_time)
      items.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
      setPurchasedItems(items);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      const detail = err.response?.data?.detail || "Failed to load your purchases.";
      setError(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("You must be logged in to view your purchases.");
      return;
    }
    fetchPurchasedItems();
  }, [user]);

  const handleMarkReceived = async (itemId) => {
    try {
      await markAsReceived(itemId);
      toast.success("Item marked as received!");
      setPurchasedItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, shipping_status: "received" } : item
        )
      );
    } catch (error) {
      console.error("Error marking item as received:", error);
      toast.error(error.response?.data?.detail || "Error marking as received");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchPurchasedItems}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!Array.isArray(purchasedItems) || purchasedItems.length === 0) {
    return (
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        You have not purchased any items yet.
      </Typography>
    );
  }

  const getImageUrl = (item) => {
    if (item.images && item.images.length > 0 && item.images[0].image) {
      return item.images[0].image;
    }
    if (item.image) {
      return item.image;
    }
    return "https://via.placeholder.com/250?text=No+Image";
  };

  // Pagination logic
  const paginatedItems = purchasedItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const pageCount = Math.ceil(purchasedItems.length / itemsPerPage);

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
        My Purchases
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <Button variant="contained" color="primary">
            Back to Auction List
          </Button>
        </Link>
      </Box>

      <Grid container spacing={2}>
        {paginatedItems.map((item) => {
          const imageUrl = getImageUrl(item);
          return (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card
                sx={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0px 4px 8px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <Link to={`/auction/${item.id}`} style={{ textDecoration: "none" }}>
                  {imageUrl ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={imageUrl}
                      alt={item.title}
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
                        borderRadius: "8px 8px 0 0",
                        color: "#fff",
                        p: 1,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: "bold", m: 0 }}>
                        {item.title}
                      </Typography>
                    </Box>
                  )}
                </Link>
                <CardContent sx={{ p: 1.5, animation: `${slideUp} 0.5s ease-out` }}>
                  <Link to={`/auction/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {item.title}
                    </Typography>
                  </Link>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {item.description}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Bought Price:</strong> $
                    {item.current_bid ? item.current_bid : item.buy_now_price}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {item.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Bought On:</strong>{" "}
                    {moment(item.end_time).format("MMMM Do YYYY, h:mm a")}
                  </Typography>
                  {item.owner?.username && (
                    <Typography variant="body2">
                      <strong>Seller:</strong> {item.owner.username}
                    </Typography>
                  )}

                  {item.buy_now_buyer && user && item.buy_now_buyer.id === user.id ? (
                    <Typography variant="body2" color="secondary" sx={{ mt: 1 }}>
                      Purchased via Buy Now
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                      Won via Bidding
                    </Typography>
                  )}

                  {item.owner?.username && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ mt: 1, mr: 1 }}
                      onClick={() => navigate(`/chat/${item.owner.username}`)}
                    >
                      Chat
                    </Button>
                  )}

                  {item.shipping_status === "shipped" && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => handleMarkReceived(item.id)}
                    >
                      Mark Received
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={pageCount}
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default MyPurchases;
