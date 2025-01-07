// frontend/src/components/AuctionList.js

import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAuctionItems, deleteAuctionItem, placeBid, buyNow } from '../services/auctionService';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Typography, TextField, Tooltip } from '@mui/material';
import styles from './AuctionList.module.css';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import BuyNowModal from './BuyNowModal';

const AuctionList = () => {
    const { user } = useContext(UserContext);
    const queryClient = useQueryClient();
    const [bidAmounts, setBidAmounts] = useState({}); // Track bid inputs

    // React Query: Fetch Auction Items
    const {
        data: auctionItems,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['auctionItems'],
        queryFn: getAllAuctionItems,
        onError: () => {
            toast.error('Failed to load auction items.');
        },
    });

    console.log('Fetched Auction Items:', auctionItems); // Debugging

    // React Query: Delete Auction Item
    const deleteMutation = useMutation({
        mutationFn: deleteAuctionItem,
        onSuccess: () => {
            queryClient.invalidateQueries(['auctionItems']);
            toast.success('Auction item deleted successfully.');
        },
        onError: () => {
            toast.error('Failed to delete auction item.');
        },
    });

    // React Query: Place Bid
    const bidMutation = useMutation({
        mutationFn: placeBid,
        onSuccess: () => {
            queryClient.invalidateQueries(['auctionItems']);
            toast.success('Bid placed successfully!');
        },
        onError: (error) => {
            if (error.response && error.response.data.detail) {
                toast.error(error.response.data.detail);
            } else {
                toast.error('Failed to place bid. Please try again.');
            }
        },
    });

    // React Query: Buy Now
    const buyNowMutation = useMutation({
        mutationFn: buyNow,
        onSuccess: () => {
            queryClient.invalidateQueries(['auctionItems']);
            toast.success('Purchase successful!');
        },
        onError: (error) => {
            if (error.response && error.response.data.detail) {
                toast.error(error.response.data.detail);
            } else {
                toast.error('Failed to complete purchase. Please try again.');
            }
        },
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this auction item?')) {
            deleteMutation.mutate(id);
        }
    };

    const handlePlaceBid = (id) => {
        const amount = parseFloat(bidAmounts[id]);
        if (isNaN(amount)) {
            toast.error('Please enter a valid bid amount.');
            return;
        }
        bidMutation.mutate({ id, amount });
    };

    // Handlers for Buy Now Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const openBuyNowModal = (item) => {
        setSelectedItem(item);
        setModalOpen(true);
    };

    const closeBuyNowModal = () => {
        setSelectedItem(null);
        setModalOpen(false);
    };

    const handleConfirmBuyNow = () => {
        if (!selectedItem) return;
        buyNowMutation.mutate(selectedItem.id);
        closeBuyNowModal();
    };

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Failed to load auction items.</p>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Typography variant="h4">Auction Items</Typography>
                <Link to="/create" style={{ textDecoration: 'none' }}>
                    <Button variant="contained" color="primary">
                        Create New Auction
                    </Button>
                </Link>
            </div>
            <div>
                {Array.isArray(auctionItems) && auctionItems.length > 0 ? (
                    auctionItems.map((item) => {
                        // Determine if the current user can bid
                        const canBid =
                            user &&
                            item.owner &&
                            user.username !== item.owner.username &&
                            item.status === 'active' &&
                            !item.buy_now_buyer;

                        // Determine if Buy Now is available
                        const canBuyNow =
                            user &&
                            item.owner &&
                            user.username !== item.owner.username &&
                            item.status === 'active' &&
                            item.buy_now_price &&
                            !item.buy_now_buyer;

                        // Calculate the minimum bid (2% increment)
                        const minBid = item.current_bid ? parseFloat(item.current_bid) : parseFloat(item.starting_bid);
                        const minIncrement = minBid * 0.02;
                        const minRequiredBid = (minBid + minIncrement).toFixed(2);

                        // Format end time for display
                        const formattedEndTime = moment(item.end_time).format('MMMM Do YYYY, h:mm:ss a');

                        return (
                            <Card key={item.id} className={styles.auctionCard}>
                                <CardContent>
                                    <Link to={`/auction/${item.id}`} className={styles.productLink}>
                                        <Typography variant="h5">{item.title}</Typography>
                                    </Link>
                                    <Typography variant="body2">{item.description}</Typography>
                                    <Typography variant="body1">Starting Bid: ${item.starting_bid}</Typography>
                                    <Typography variant="body1">Current Bid: ${item.current_bid || 'No bids yet'}</Typography>
                                    {item.image && (
                                        <img src={item.image} alt={item.title} className={styles.image} />
                                    )}
                                    <Typography variant="body2">Status: {item.status}</Typography>
                                    <Typography variant="body2">End Time: {formattedEndTime}</Typography>
                                    {/* Accessing owner's username correctly */}
                                    {item.owner && item.owner.username && (
                                        <Typography variant="body2">Owner: {item.owner.username}</Typography>
                                    )}
                                    {/* Display Buy Now Price if available */}
                                    {item.buy_now_price && (
                                        <Typography variant="body1" color="secondary">
                                            Buy Now Price: ${item.buy_now_price}
                                        </Typography>
                                    )}
                                    {/* Conditionally render Update and Delete buttons */}
                                    {user && user.username === item.owner.username && (
                                        <div className={styles.buttonGroup}>
                                            {item.bids.length > 0 || item.buy_now_buyer ? (
                                                <Tooltip title="Cannot delete auction items that have received bids or been purchased via Buy Now.">
                                                    <span>
                                                        <Button
                                                            variant="outlined"
                                                            color="secondary"
                                                            className={styles.button}
                                                            disabled
                                                        >
                                                            Delete
                                                        </Button>
                                                    </span>
                                                </Tooltip>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="outlined"
                                                        color="secondary"
                                                        onClick={() => handleDelete(item.id)}
                                                        className={styles.button}
                                                    >
                                                        Delete
                                                    </Button>
                                                    <Link to={`/update/${item.id}`} style={{ textDecoration: 'none' }}>
                                                        <Button variant="outlined" color="primary">
                                                            Update
                                                        </Button>
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {/* Conditionally render Bid form */}
                                    {canBid && (
                                        <div className={styles.bidSection}>
                                            <Typography variant="subtitle1">Place Your Bid (Min: ${minRequiredBid}):</Typography>
                                            <TextField
                                                type="number"
                                                value={bidAmounts[item.id] || ''}
                                                onChange={(e) => setBidAmounts({ ...bidAmounts, [item.id]: e.target.value })}
                                                inputProps={{
                                                    min: minRequiredBid,
                                                    step: "0.01",
                                                }}
                                                variant="outlined"
                                                size="small"
                                                className={styles.bidInput}
                                            />
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() => handlePlaceBid(item.id)}
                                                className={styles.bidButton}
                                            >
                                                Bid
                                            </Button>
                                        </div>
                                    )}
                                    {/* Conditionally render Buy Now button */}
                                    {canBuyNow && (
                                        <div className={styles.buyNowSection}>
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => openBuyNowModal(item)}
                                                className={styles.buyNowButton}
                                            >
                                                Buy Now for ${item.buy_now_price}
                                            </Button>
                                        </div>
                                    )}
                                    {/* If item is bought via Buy Now, display buyer info */}
                                    {item.buy_now_buyer && (
                                        <Typography variant="body1" color="primary">
                                            Purchased via Buy Now by: {item.buy_now_buyer.username}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Typography variant="body1">No auction items available.</Typography>
                )}
            </div>
            {/* Buy Now Modal */}
            {selectedItem && (
                <BuyNowModal
                    open={modalOpen}
                    handleClose={closeBuyNowModal}
                    handleConfirm={handleConfirmBuyNow}
                    buyNowPrice={selectedItem.buy_now_price}
                />
            )}
        </div>
    );

};

export default AuctionList;
