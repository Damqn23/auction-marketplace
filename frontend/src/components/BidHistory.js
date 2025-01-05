import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { Typography, Card, CardContent } from '@mui/material';
import styles from './BidHistory.module.css'; // Create corresponding CSS Module
import { toast } from 'react-toastify';

const BidHistory = () => {
    const { user } = useContext(UserContext);
    const [bids, setBids] = useState([]);

    useEffect(() => {
        if (user && user.bids) {
            setBids(user.bids);
        } else {
            toast.error('No bid history available.');
        }
    }, [user]);

    return (
        <div className={styles.container}>
            <Typography variant="h4" gutterBottom>My Bids</Typography>
            {bids.length === 0 ? (
                <Typography variant="body1">You have not placed any bids yet.</Typography>
            ) : (
                bids.map(bid => (
                    <Card key={bid.id} className={styles.bidCard}>
                        <CardContent>
                            <Typography variant="h6">Bid on Auction Item ID: {bid.auction_item}</Typography>
                            <Typography variant="body1">Amount: ${bid.amount}</Typography>
                            <Typography variant="body2">Time: {new Date(bid.timestamp).toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};

export default BidHistory;
