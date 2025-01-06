// frontend/src/components/MyPurchases.js

import React, { useState, useEffect, useContext } from 'react';
import { getMyPurchases } from '../services/auctionService'; // Service to fetch purchases
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Typography } from '@mui/material';
import styles from './MyPurchases.module.css'; // CSS Module

const MyPurchases = () => {
    const { user } = useContext(UserContext);
    const [purchasedItems, setPurchasedItems] = useState([]); // Initialize as empty array
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
            // Debugging: Log the response data
            console.log('My Purchases API Response:', response);

            if (response && Array.isArray(response)) {
                setPurchasedItems(response);
            } else if (response && response.data && Array.isArray(response.data)) {
                // In case your service returns { data: [...] }
                setPurchasedItems(response.data);
            } else {
                // Handle unexpected data formats
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
        <div className={styles.container}>
            <div className={styles.header}>
                <Typography variant="h4">My Purchases</Typography>
                <Link to="/">
                    <Button variant="contained" color="primary">
                        Back to Auction List
                    </Button>
                </Link>
            </div>
            <div>
                {purchasedItems.map((item) => (
                    <Card key={item.id} className={styles.purchaseCard}>
                        <CardContent>
                            <Typography variant="h5">{item.title}</Typography>
                            <Typography variant="body2">{item.description}</Typography>
                            <Typography variant="body1">Bought Price: ${item.current_bid || item.buy_now_price}</Typography>
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className={styles.purchaseImage}
                                />
                            )}
                            <Typography variant="body2">Status: {item.status}</Typography>
                            <Typography variant="body2">
                                Bought On: {moment(item.end_time).format('MMMM Do YYYY, h:mm:ss a')}
                            </Typography>
                            <Typography variant="body2">Seller: {item.owner}</Typography>
                            {/* Display Purchase Method */}
                            {item.buy_now_buyer && item.buy_now_buyer.id === user.id ? (
                                <Typography variant="body1" color="secondary">
                                    Purchased via Buy Now
                                </Typography>
                            ) : (
                                <Typography variant="body1" color="primary">
                                    Won via Bidding
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default MyPurchases;
