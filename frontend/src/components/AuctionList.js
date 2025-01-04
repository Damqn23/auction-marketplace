// src/components/AuctionList.js

import React, { useEffect, useState } from 'react';
import { getAllAuctionItems, deleteAuctionItem } from '../services/auctionService';
import { Link } from 'react-router-dom'; // v6/v7
import { Button, Card, CardContent, Typography } from '@mui/material'; // Optional: Using Material-UI

const AuctionList = () => {
    const [auctionItems, setAuctionItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAuctionItems();
    }, []);

    const fetchAuctionItems = async () => {
        try {
            const response = await getAllAuctionItems();
            setAuctionItems(response.data);
            setLoading(false);
        } catch (err) {
            setError(err);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this auction item?')) {
            try {
                await deleteAuctionItem(id);
                setAuctionItems(auctionItems.filter(item => item.id !== id));
            } catch (err) {
                console.error('Error deleting auction item:', err);
            }
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error loading auction items.</p>;

    return (
        <div>
            <Typography variant="h4">Auction Items</Typography>
            <Link to="/create">
                <Button variant="contained" color="primary" style={{ margin: '10px 0' }}>
                    Create New Auction
                </Button>
            </Link>
            <div>
                {auctionItems.map(item => (
                    <Card key={item.id} style={{ margin: '10px 0' }}>
                        <CardContent>
                            <Typography variant="h5">{item.title}</Typography>
                            <Typography variant="body2">{item.description}</Typography>
                            <Typography variant="body1">Starting Bid: ${item.starting_bid}</Typography>
                            <Typography variant="body1">Current Bid: ${item.current_bid || 'No bids yet'}</Typography>
                            {item.image && <img src={item.image} alt={item.title} width="200" />}
                            <Typography variant="body2">Status: {item.status}</Typography>
                            <Typography variant="body2">Owner: {item.owner}</Typography>
                            <Button variant="outlined" color="secondary" onClick={() => handleDelete(item.id)} style={{ marginRight: '10px' }}>
                                Delete
                            </Button>
                            <Link to={`/update/${item.id}`}>
                                <Button variant="outlined" color="primary">
                                    Update
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AuctionList;
