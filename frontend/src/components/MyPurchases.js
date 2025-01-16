import React, { useState, useEffect, useContext } from 'react';
import { getMyPurchases } from '../services/auctionService';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import { Link } from 'react-router-dom';
import {
    Button,
    Card,
    CardContent,
    Grid,
    Typography,
    Container,
} from '@mui/material';
import styles from './MyPurchases.module.css';

const MyPurchases = () => {
    const { user } = useContext(UserContext);
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchPurchasedItems();
        } else {
            setLoading(false);
            setPurchasedItems([]);
        }
        // eslint-disable-next-line
    }, [user]);

    const fetchPurchasedItems = async () => {
        try {
            const response = await getMyPurchases();
            console.log('My Purchases API Response:', response);

            if (response && Array.isArray(response)) {
                setPurchasedItems(response);
            } else if (response && response.data && Array.isArray(response.data)) {
                setPurchasedItems(response.data);
            } else {
                setPurchasedItems([]);
                console.warn('Unexpected data format:', response);
                toast.warn('Received unexpected data format from server.');
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching purchases:', err);
            setError('Failed to load your purchases.');
            setLoading(false);
            toast.error('Failed to load your purchases.');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!Array.isArray(purchasedItems)) return <p>Unexpected data format received.</p>;
    if (purchasedItems.length === 0) return <p>You have not purchased any items yet.</p>;

    return (
        <Container maxWidth="lg" className={styles.container}>
            <div className={styles.header}>
                <Typography variant="h4" component="h2" gutterBottom>
                    My Purchases
                </Typography>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <Button variant="contained" color="primary">
                        Back to Auction List
                    </Button>
                </Link>
            </div>

            <Grid container spacing={3}>
                {purchasedItems.map((item) => (
                    <Grid item xs={12} md={6} lg={4} key={item.id}>
                        <Card className={styles.purchaseCard}>
                            <CardContent>
                                {/* Add Link to redirect to the product details page */}
                                <Link to={`/auction/${item.id}`} style={{ textDecoration: 'none' }}>
                                    <Typography variant="h6" gutterBottom>
                                        {item.title}
                                    </Typography>
                                </Link>
                                <Typography variant="body2" color="textSecondary" paragraph>
                                    {item.description}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Bought Price:</strong>{' '}
                                    {item.current_bid ? `$${item.current_bid}` : `$${item.buy_now_price}`}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Status:</strong> {item.status}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Bought On:</strong>{' '}
                                    {moment(item.end_time).format('MMMM Do YYYY, h:mm:ss a')}
                                </Typography>
                                {item.owner && item.owner.username && (
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
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default MyPurchases;
