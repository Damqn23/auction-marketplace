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

      // Standardize the data extraction (supporting either response.data or the response itself)
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
        {purchasedItems.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card className={styles.purchaseCard}>
              {/* Creative Placeholder displaying the full product title */}
              <div className={styles.creativePlaceholder}>
                <Typography variant="h4" className={styles.placeholderText}>
                  {item.title}
                </Typography>
              </div>
              <CardContent>
                {/* Link to the product details page */}
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
                {/* Chat button (if seller info is available) */}
                {item.owner?.username && (
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/chat/${item.owner.username}`)}
                  >
                    Chat with Owner
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MyPurchases;
