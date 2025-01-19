import React, { useEffect, useState } from 'react';
import { getMyAuctions } from '../services/auctionService';
import { Link } from 'react-router-dom';
import styles from './MyAuctions.module.css';
import { CircularProgress, Card, CardContent, CardMedia, Typography, Button, Grid } from '@mui/material';

const MyAuctions = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyAuctions = async () => {
            try {
                const data = await getMyAuctions();
                setAuctions(data);
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
                <p>Loading your auctions...</p>
            </div>
        );
    }

    if (error) {
        return <p className={styles.error}>{error}</p>;
    }

    return (
        <div className={styles.container}>
            <Typography variant="h4" className={styles.header}>
                My Auctions
            </Typography>
            {auctions.length > 0 ? (
                <Grid container spacing={3} className={styles.auctionGrid}>
                    {auctions.map((auction) => (
                        <Grid item xs={12} sm={6} md={4} key={auction.id}>
                            <Card className={styles.auctionCard}>
                                {auction.image && (
                                    <CardMedia
                                        component="img"
                                        height="140"
                                        image={auction.image}
                                        alt={auction.title}
                                        className={styles.cardImage}
                                    />
                                )}
                                <CardContent>
                                    <Typography variant="h6" className={styles.cardTitle}>
                                        {auction.title}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" className={styles.cardDescription}>
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
        </div>
    );
};

export default MyAuctions;
