import React, { useEffect, useState, useContext } from 'react';
import { getAllAuctionItems, deleteAuctionItem } from '../services/auctionService';
import { Link } from 'react-router-dom'; // v6/v7
import { Button, Card, CardContent, Typography } from '@mui/material'; // Using Material-UI
import styles from './AuctionList.module.css'; // Import CSS Module
import { UserContext } from '../contexts/UserContext'; // Import UserContext
import { toast } from 'react-toastify';

const AuctionList = () => {
    const [auctionItems, setAuctionItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(UserContext); // Access current user

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
                {auctionItems.map(item => (
                    <Card key={item.id} className={styles.auctionCard}>
                        <CardContent>
                            <Typography variant="h5">{item.title}</Typography>
                            <Typography variant="body2">{item.description}</Typography>
                            <Typography variant="body1">Starting Bid: ${item.starting_bid}</Typography>
                            <Typography variant="body1">Current Bid: ${item.current_bid || 'No bids yet'}</Typography>
                            {item.image && <img src={item.image} alt={item.title} className={styles.auctionImage} />}
                            <Typography variant="body2">Status: {item.status}</Typography>
                            <Typography variant="body2">Owner: {item.owner}</Typography>
                            {/* Conditionally render Update and Delete buttons */}
                            {user && user.username === item.owner && (
                                <div className={styles.buttonGroup}>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => handleDelete(item.id)}
                                        className={styles.button}
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
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AuctionList;
