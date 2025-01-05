import React, { useEffect, useState, useContext } from 'react';
import { getAllAuctionItems, deleteAuctionItem, placeBid } from '../services/auctionService';
import { Link } from 'react-router-dom'; // v6/v7
import { Button, Card, CardContent, Typography, TextField } from '@mui/material'; // Using Material-UI
import styles from './AuctionList.module.css'; // Import CSS Module
import { UserContext } from '../contexts/UserContext'; // Import UserContext
import { toast } from 'react-toastify';
import moment from 'moment'; // For date formatting

const AuctionList = () => {
    const [auctionItems, setAuctionItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(UserContext); // Access current user
    const [bidAmounts, setBidAmounts] = useState({}); // Track bid inputs

    useEffect(() => {
        fetchAuctionItems();
        // eslint-disable-next-line
    }, []);

    const fetchAuctionItems = async () => {
        try {
            const response = await getAllAuctionItems();
            setAuctionItems(response.data);
            setLoading(false);
        } catch (err) {
            setError(err);
            setLoading(false);
            toast.error('Failed to load auction items.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this auction item?')) {
            try {
                await deleteAuctionItem(id);
                setAuctionItems(auctionItems.filter(item => item.id !== id));
                toast.success('Auction item deleted successfully.');
            } catch (err) {
                console.error('Error deleting auction item:', err);
                toast.error('Failed to delete auction item.');
            }
        }
    };

    const handleBidChange = (id, value) => {
        setBidAmounts({
            ...bidAmounts,
            [id]: value,
        });
    };

    const handlePlaceBid = async (item) => {
        const bidValue = parseFloat(bidAmounts[item.id]);
        if (isNaN(bidValue)) {
            toast.error('Please enter a valid bid amount.');
            return;
        }

        try {
            await placeBid(item.id, bidValue);
            toast.success('Bid placed successfully!');
            // Refresh auction items to update current bid
            fetchAuctionItems();
            // Clear the bid input
            setBidAmounts({
                ...bidAmounts,
                [item.id]: '',
            });
        } catch (err) {
            console.error('Error placing bid:', err);
            if (err.response && err.response.data.detail) {
                toast.error(err.response.data.detail);
            } else {
                toast.error('Failed to place bid. Please try again.');
            }
        }
    };


    const calculateRemainingTime = (endTime) => {
        const now = moment();
        const end = moment(endTime);
        const duration = moment.duration(end.diff(now));

        if (duration.asSeconds() <= 0) {
            return 'Auction ended';
        }

        const days = Math.floor(duration.asDays());
        const hours = Math.floor(duration.asHours() % 24);
        const minutes = Math.floor(duration.asMinutes() % 60);
        const seconds = Math.floor(duration.asSeconds() % 60);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setAuctionItems([...auctionItems]); // Trigger re-render
        }, 1000);

        return () => clearInterval(interval);
    }, [auctionItems]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error loading auction items.</p>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Typography variant="h4">Auction Items</Typography>
                <Link to="/create">
                    <Button variant="contained" color="primary">
                        Create New Auction
                    </Button>
                </Link>
            </div>
            <div>
                {auctionItems.map(item => {
                    // Determine if the current user can bid
                    const canBid = user && user.username !== item.owner && item.status === 'active';

                    // Calculate the minimum bid (2% increment)
                    const minBid = item.current_bid ? parseFloat(item.current_bid) : parseFloat(item.starting_bid);
                    const minIncrement = minBid * 0.02;
                    const minRequiredBid = (minBid + minIncrement).toFixed(2);

                    const remainingTime = calculateRemainingTime(item.end_time);

                    // Format end time for display
                    const formattedEndTime = moment(item.end_time).format('MMMM Do YYYY, h:mm:ss a');

                    return (
                        <Card key={item.id} className={styles.auctionCard}>
                            <CardContent>
                                <Typography variant="h5">{item.title}</Typography>
                                <Typography variant="body2">{item.description}</Typography>
                                <Typography variant="body1">Starting Bid: ${item.starting_bid}</Typography>
                                <Typography variant="body1">Current Bid: ${item.current_bid || 'No bids yet'}</Typography>
                                {item.image && <img src={item.image} alt={item.title} className={styles.auctionImage} />}
                                <Typography variant="body2">Status: {item.status}</Typography>
                                <Typography variant="body2">End Time: {formattedEndTime}</Typography>
                                <Typography variant="body2">Time Remaining: {remainingTime}</Typography>
                                <Typography variant="body2">Owner: {item.owner}</Typography>
                                {/* Conditionally render Update and Delete buttons */}
                                {user && user.username === item.owner && (
                                    <div className={styles.buttonGroup}>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            onClick={() => handleDelete(item.id)}
                                            className={styles.button}
                                            disabled={item.bids.length > 0} // Disable delete if bids exist
                                        >
                                            Delete
                                        </Button>
                                        <Link to={`/update/${item.id}`}>
                                            <Button variant="outlined" color="primary">
                                                Update
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                                {/* Conditionally render Bid form */}
                                {canBid && (
                                    <div className={styles.bidSection}>
                                        <Typography variant="subtitle1">Place Your Bid (Min: ${minRequiredBid}):</Typography>
                                        <TextField
                                            type="number"
                                            value={bidAmounts[item.id] || ''}
                                            onChange={(e) => handleBidChange(item.id, e.target.value)}
                                            inputProps={{
                                                min: minRequiredBid,
                                                step: "0.01"
                                            }}
                                            variant="outlined"
                                            size="small"
                                            className={styles.bidInput}
                                        />
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={() => handlePlaceBid(item)}
                                            className={styles.bidButton}
                                        >
                                            Bid
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AuctionList;
