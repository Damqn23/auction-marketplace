import React, { useState, useEffect, useContext } from 'react';
import { getUserBids } from '../services/bidService';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
    CircularProgress,
    Typography,
    Card,
    CardContent
} from '@mui/material';
import styles from './BidHistory.module.css';

const BidHistory = () => {
    const { user } = useContext(UserContext);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchBids();
        } else {
            setLoading(false);
            setBids([]);
        }
        // eslint-disable-next-line
    }, [user]);

    const fetchBids = async () => {
        try {
            const response = await getUserBids(user.id); // Adjust according to your API
            // Sort bids by timestamp (descending)
            const sortedBids = response.data.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );
            setBids(sortedBids);
            setLoading(false);
        } catch (err) {
            setError('Failed to load bid history.');
            toast.error('Failed to load bid history.');
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
            <Typography variant="body1" color="error" className={styles.errorText}>
                {error}
            </Typography>
        );
    }

    if (bids.length === 0) {
        return (
            <Typography variant="body1" className={styles.noBidsText}>
                No bids placed yet.
            </Typography>
        );
    }

    return (
        <div className={styles.container}>
            <Typography variant="h4" gutterBottom>
                My Bids
            </Typography>
            {bids.map((bid) => (
                <Card key={bid.id} className={styles.bidCard}>
                    <CardContent>
                        <Typography variant="subtitle1" className={styles.bidTitle}>
                            <strong>Bid on Auction Item ID:</strong> {bid.auction_item}
                        </Typography>
                        <Typography variant="body2" className={styles.bidDetails}>
                            <strong>Amount:</strong> ${bid.amount}
                        </Typography>
                        <Typography variant="body2" className={styles.bidDetails}>
                            <strong>Time:</strong>{' '}
                            {moment(bid.timestamp).format('MMMM Do YYYY, h:mm:ss a')}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default BidHistory;
