import React, { useState, useEffect, useContext } from 'react';
import { getUserBids } from '../services/bidService'; // Ensure this service fetches user bids
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment'; // Ensure moment.js is installed
import styles from './BidHistory.module.css'; // Import CSS Module

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
            // Sort bids by timestamp descending
            const sortedBids = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setBids(sortedBids);
            setLoading(false);
        } catch (err) {
            setError('Failed to load bid history.');
            toast.error('Failed to load bid history.');
            setLoading(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (bids.length === 0) return <p>No bids placed yet.</p>;

    return (
        <div className={styles.container}>
            <h2>My Bids</h2>
            {bids.map((bid) => (
                <div key={bid.id} className={styles.bidCard}>
                    <p className={styles.bidTitle}><strong>Bid on Auction Item ID:</strong> {bid.auction_item}</p>
                    <p className={styles.bidDetails}><strong>Amount:</strong> ${bid.amount}</p>
                    <p className={styles.bidDetails}><strong>Time:</strong> {moment(bid.timestamp).format('MMMM Do YYYY, h:mm:ss a')}</p>
                </div>
            ))}
        </div>
    );
};

export default BidHistory;
