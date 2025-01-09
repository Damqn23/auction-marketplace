// frontend/src/components/AuctionList.js

import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAuctionItems, deleteAuctionItem, placeBid, buyNow } from '../services/auctionService';
import { Link } from 'react-router-dom';
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Grid,
    Typography,
    TextField,
    Tooltip
} from '@mui/material';
import styles from './AuctionList.module.css';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import BuyNowModal from './BuyNowModal';

const AuctionList = () => {
    const { user } = useContext(UserContext);
    const queryClient = useQueryClient();
    const [bidAmounts, setBidAmounts] = useState({}); // Track bid inputs

    // Fetch Auction Items
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

    // Delete Auction Item
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

    // Place Bid
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

    // Buy Now
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

    // Handlers
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

    // Buy Now Modal
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

    // Loading/Errors
    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Failed to load auction items.</p>;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Auction Items
                </Typography>
                <Link to="/create" style={{ textDecoration: 'none' }}>
                    <Button variant="contained" color="primary">
                        Create New Auction
                    </Button>
                </Link>
            </div>

            {Array.isArray(auctionItems) && auctionItems.length > 0 ? (
                <Grid container spacing={2}>
                    {auctionItems.map((item) => {
                        // Determine if current user can place a bid
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

                        // Calculate the minimum required bid (2% increment)
                        const minBid = item.current_bid
                            ? parseFloat(item.current_bid)
                            : parseFloat(item.starting_bid);
                        const minIncrement = minBid * 0.02;
                        const minRequiredBid = (minBid + minIncrement).toFixed(2);

                        // Format end time
                        const formattedEndTime = moment(item.end_time).format(
                            'MMMM Do YYYY, h:mm:ss a'
                        );

                        return (
                            <Grid item xs={12} md={6} lg={4} key={item.id}>
                                <Card className={styles.auctionCard}>
                                    {/* Card Image (or fallback text) */}
                                    {item.images && item.images.length > 0 ? (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={item.images[0].image}
                                            alt={item.title}
                                        />
                                    ) : (
                                        <div className={styles.noImageFallback}>
                                            <Typography variant="body2" color="textSecondary">
                                                No image available
                                            </Typography>
                                        </div>
                                    )}

                                    <CardContent>
                                        <Link to={`/auction/${item.id}`} className={styles.productLink}>
                                            <Typography variant="h6" component="div" gutterBottom>
                                                {item.title}
                                            </Typography>
                                        </Link>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            {item.description}
                                        </Typography>
                                        <Typography variant="body1">
                                            <strong>Starting Bid:</strong> ${item.starting_bid}
                                        </Typography>
                                        <Typography variant="body1">
                                            <strong>Current Bid:</strong>{' '}
                                            {item.current_bid ? `$${item.current_bid}` : 'No bids yet'}
                                        </Typography>
                                        {item.buy_now_price && (
                                            <Typography variant="body1" color="secondary">
                                                <strong>Buy Now Price:</strong> ${item.buy_now_price}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            <strong>Status:</strong> {item.status}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>End Time:</strong> {formattedEndTime}
                                        </Typography>
                                        {item.owner && item.owner.username && (
                                            <Typography variant="body2">
                                                <strong>Owner:</strong> {item.owner.username}
                                            </Typography>
                                        )}

                                        {/* If item is purchased via Buy Now, show buyer info */}
                                        {item.buy_now_buyer && (
                                            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                                                Purchased via Buy Now by: {item.buy_now_buyer.username}
                                            </Typography>
                                        )}
                                    </CardContent>

                                    {/* Card Actions (bottom of the card) */}
                                    <CardActions className={styles.cardActions}>
                                        {/* If the current user is the owner, show Delete/Update */}
                                        {user && user.username === item.owner.username && (
                                            <>
                                                {item.bids.length > 0 || item.buy_now_buyer ? (
                                                    <Tooltip title="Cannot delete items that have bids or have been purchased.">
                                                        <span>
                                                            <Button
                                                                variant="outlined"
                                                                color="secondary"
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
                                                        >
                                                            Delete
                                                        </Button>
                                                        <Link
                                                            to={`/update/${item.id}`}
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            <Button variant="outlined" color="primary">
                                                                Update
                                                            </Button>
                                                        </Link>
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {/* If the user is not the owner and item is active, show Bid + Buy Now */}
                                        {canBid && (
                                            <div className={styles.bidSection}>
                                                <TextField
                                                    label={`Min: $${minRequiredBid}`}
                                                    type="number"
                                                    value={bidAmounts[item.id] || ''}
                                                    onChange={(e) =>
                                                        setBidAmounts({
                                                            ...bidAmounts,
                                                            [item.id]: e.target.value,
                                                        })
                                                    }
                                                    inputProps={{
                                                        min: minRequiredBid,
                                                        step: '0.01',
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

                                        {canBuyNow && (
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => openBuyNowModal(item)}
                                                className={styles.buyNowButton}
                                            >
                                                Buy Now
                                            </Button>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Typography variant="body1" sx={{ mt: 2 }}>
                    No auction items available.
                </Typography>
            )}

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
