// frontend/src/components/MyAuctions.js

import React, { useEffect, useState } from 'react';
import { getMyAuctions } from '../services/auctionService';
import { Link } from 'react-router-dom';
import {
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Container,
} from '@mui/material';
import styles from './MyAuctions.module.css';

const MyAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyAuctions = async () => {
      try {
        const data = await getMyAuctions();
        if (Array.isArray(data)) {
          // Sort auctions by creation date (assumes each auction has a 'created_at' property)
          const sortedData = data.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setAuctions(sortedData);
        } else {
          setError('Unexpected data format received.');
        }
      } catch (err) {
        setError('Failed to load auctions.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyAuctions();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress />
        <Typography variant="body1" color="textSecondary">
          Loading your auctions...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <Typography variant="body1" color="error" className={styles.error}>
        {error}
      </Typography>
    );
  }

  return (
    <Container className={styles.container}>
      <Typography variant="h4" className={styles.header}>
        My Auctions
      </Typography>
      {auctions.length > 0 ? (
        <Grid container spacing={3} className={styles.auctionGrid}>
          {auctions.map((auction) => (
            <Grid item xs={12} sm={6} md={4} key={auction.id}>
              <Card className={styles.auctionCard}>
                {/* Image Section: If auction has images, display the first image; otherwise, show a fallback */}
                {auction.images && auction.images.length > 0 ? (
                  <CardMedia
                    component="img"
                    height="250"
                    image={auction.images[0].image}
                    alt={auction.title}
                    className={styles.cardMedia}
                  />
                ) : (
                  <div className={styles.noImageFallback}>
                    <Typography variant="body2" color="textSecondary">
                      No image available
                    </Typography>
                  </div>
                )}

                <CardContent className={styles.cardContent}>
                  <Typography variant="h6" className={styles.cardTitle}>
                    {auction.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    className={styles.cardDescription}
                  >
                    {auction.description.length > 100
                      ? `${auction.description.substring(0, 100)}...`
                      : auction.description}
                  </Typography>
                  <Typography variant="body2" className={styles.cardDetails}>
                    <strong>Starting Bid:</strong> ${auction.starting_bid}
                  </Typography>
                  <Typography variant="body2" className={styles.cardDetails}>
                    <strong>Current Bid:</strong> ${auction.current_bid || 'N/A'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={auction.status === 'active' ? 'primary' : 'error'}
                    className={styles.cardStatus}
                  >
                    <strong>Status:</strong> {auction.status}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={Link}
                    to={`/auction/${auction.id}`}
                    className={styles.viewButton}
                  >
                    View Auction
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" className={styles.noAuctions}>
          You have not posted any auctions yet.
        </Typography>
      )}
    </Container>
  );
};

export default MyAuctions;
