import React, { useState, useEffect, useContext } from "react";
import { getMyPurchases } from "../services/auctionService";
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
} from "@mui/material";
import { keyframes } from "@emotion/react";

// Keyframe animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const MyPurchases = () => {
  const { user } = useContext(UserContext);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Helper function to get the image URL.
  // It checks item.images, then item.image, then item.auction.images.
  // If none found, it returns a placeholder URL.
  const getImageUrl = (item) => {
    if (item.images && item.images.length > 0 && item.images[0].image) {
      return item.images[0].image;
    }
    if (item.image) {
      return item.image;
    }
    if (item.auction && item.auction.images && item.auction.images.length > 0 && item.auction.images[0].image) {
      return item.auction.images[0].image;
    }
    return "https://via.placeholder.com/250?text=No+Image";
  };

  useEffect(() => {
    if (user) {
      fetchPurchasedItems();
    } else {
      setLoading(false);
      setPurchasedItems([]);
    }
  }, [user]);

  const fetchPurchasedItems = async () => {
    try {
      const response = await getMyPurchases();
      console.log("My Purchases API Response:", response);
      const items =
        (response?.data && Array.isArray(response.data) && response.data) ||
        (Array.isArray(response) && response) ||
        [];
      if (items.length === 0) {
        toast.warn("No purchases found.");
      }
      setPurchasedItems(items);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setError("Failed to load your purchases.");
      toast.error("Failed to load your purchases.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
  }

  if (error) {
    return (
      <Typography variant="body1" color="error" align="center" sx={{ mt: 2 }}>
        {error}
      </Typography>
    );
  }

  if (!Array.isArray(purchasedItems)) {
    return (
      <Typography variant="body1" color="error" align="center" sx={{ mt: 2 }}>
        Unexpected data format received.
      </Typography>
    );
  }

  if (purchasedItems.length === 0) {
    return (
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        You have not purchased any items yet.
      </Typography>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        p: 2,
        maxWidth: "1200px",
        margin: "auto",
        backgroundColor: "#fafafa",
        animation: `${fadeIn} 1s ease-in-out`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          My Purchases
        </Typography>
        <Link to="/" style={{ textDecoration: "none" }}>
          <Button variant="contained" color="primary">
            Back to Auction List
          </Button>
        </Link>
      </Box>

      <Grid container spacing={3}>
        {purchasedItems.map((item) => {
          const imageUrl = getImageUrl(item);
          return (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card
                sx={{
                  backgroundColor: "#fff",
                  color: "#333",
                  borderRadius: "8px",
                  border: "1px solid #444",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px) scale(1.02)",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                {/* Make the image clickable by wrapping it in a Link */}
                <Link to={`/auction/${item.id}`} style={{ textDecoration: "none" }}>
                  {imageUrl ? (
                    <CardMedia
                      component="img"
                      height="250"
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
                        height: "250px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(135deg, #6a11cb, #2575fc)",
                        borderRadius: "8px 8px 0 0",
                        color: "#fff",
                        p: 1,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontSize: "1.75rem",
                          fontWeight: "bold",
                          m: 0,
                        }}
                      >
                        {item.title}
                      </Typography>
                    </Box>
                  )}
                </Link>
                <CardContent
                  sx={{
                    p: 2,
                    animation: `${slideUp} 0.5s ease-out`,
                  }}
                >
                  <Link
                    to={`/auction/${item.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {item.title}
                    </Typography>
                  </Link>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.description}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Bought Price:</strong>{" "}
                    {item.current_bid
                      ? `$${item.current_bid}`
                      : `$${item.buy_now_price}`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {item.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Bought On:</strong>{" "}
                    {moment(item.end_time).format("MMMM Do YYYY, h:mm:ss a")}
                  </Typography>
                  {item.owner?.username && (
                    <Typography variant="body2">
                      <strong>Seller:</strong> {item.owner.username}
                    </Typography>
                  )}
                  {item.buy_now_buyer && item.buy_now_buyer.id === user.id ? (
                    <Typography variant="body1" color="secondary" sx={{ mt: 1 }}>
                      Purchased via Buy Now
                    </Typography>
                  ) : (
                    <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
                      Won via Bidding
                    </Typography>
                  )}
                  {item.owner?.username && (
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      onClick={() => navigate(`/chat/${item.owner.username}`)}
                    >
                      Chat with Seller
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default MyPurchases;
