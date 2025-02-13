// frontend/src/components/MyPurchases.js

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
} from "@mui/material";
import styles from "./MyPurchases.module.css";

const MyPurchases = () => {
  const { user } = useContext(UserContext);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Helper function to get the image URL:
  const getImageUrl = (item) => {
    // Check if the item itself has an images array
    if (item.images && item.images.length > 0) {
      return item.images[0].image;
    }
    // Otherwise, check if the item has an auction object with images
    if (item.auction && item.auction.images && item.auction.images.length > 0) {
      return item.auction.images[0].image;
    }
    return null;
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
      <div className={styles.loader}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Typography
        variant="body1"
        color="error"
        align="center"
        className={styles.errorText}
      >
        {error}
      </Typography>
    );
  }

  if (!Array.isArray(purchasedItems)) {
    return (
      <Typography
        variant="body1"
        color="error"
        align="center"
        className={styles.errorText}
      >
        Unexpected data format received.
      </Typography>
    );
  }

  if (purchasedItems.length === 0) {
    return (
      <Typography
        variant="body1"
        align="center"
        className={styles.noPurchasesText}
      >
        You have not purchased any items yet.
      </Typography>
    );
  }

  return (
    <Container maxWidth="lg" className={styles.container}>
      <div className={styles.header}>
        <Typography variant="h4" component="h2" gutterBottom>
          My Purchases
        </Typography>
        <Link to="/" className={styles.backLink}>
          <Button variant="contained" color="primary">
            Back to Auction List
          </Button>
        </Link>
      </div>

      <Grid container spacing={3}>
        {purchasedItems.map((item) => {
          const imageUrl = getImageUrl(item);
          return (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card className={styles.purchaseCard}>
                {imageUrl ? (
                  <CardMedia
                    component="img"
                    height="250"
                    image={imageUrl}
                    alt={item.title}
                    className={styles.cardMedia}
                  />
                ) : (
                  <div className={styles.creativePlaceholder}>
                    <Typography variant="h4" className={styles.placeholderText}>
                      {item.title}
                    </Typography>
                  </div>
                )}
                <CardContent className={styles.cardContent}>
                  <Link to={`/auction/${item.id}`} className={styles.itemLink}>
                    <Typography variant="h6" gutterBottom>
                      {item.title}
                    </Typography>
                  </Link>
                  <Typography variant="body2" color="textSecondary" paragraph>
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
