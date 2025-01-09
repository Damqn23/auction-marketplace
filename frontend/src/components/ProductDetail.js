// frontend/src/components/ProductDetails.js

import React, { useContext, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAuctionItem,
    placeBid,
    buyNow,
    deleteAuctionItem
} from '../services/auctionService';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment';

// Material UI Components
import {
    Button,
    Card,
    CardContent,
    CardMedia,
    Typography,
    TextField,
    Tooltip,
    Grid,
    ImageList,
    ImageListItem,
    Box
} from '@mui/material';
import styles from './ProductDetail.module.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const queryClient = useQueryClient();
    const [bidAmount, setBidAmount] = useState('');

    // Fetch single auction item
    const {
        data: auctionItem,
        isLoading,
        isError
    } = useQuery({
        queryKey: ['auctionItem', id],
        queryFn: () => getAuctionItem(id),
        onError: () => {
            toast.error('Failed to load auction item.');
        }
    });

    // Debugging: Log fetched data
    console.log('User:', user);
    console.log('Auction Item:', auctionItem);

    // React Query: Place Bid
    const bidMutation = useMutation({
        mutationFn: placeBid,
        onSuccess: () => {
            queryClient.invalidateQueries(['auctionItem', id]);
            toast.success('Bid placed successfully!');
            setBidAmount('');
        },
        onError: (error) => {
            if (error.response && error.response.data.detail) {
                toast.error(error.response.data.detail);
            } else {
                toast.error('Failed to place bid. Please try again.');
            }
        }
    });

    // React Query: Buy Now
    const buyNowMutation = useMutation({
        mutationFn: buyNow,
        onSuccess: () => {
            queryClient.invalidateQueries(['auctionItem', id]);
            toast.success('Purchase successful!');
            navigate('/'); // Redirect to home or another page
        },
        onError: (error) => {
            if (error.response && error.response.data.detail) {
                toast.error(error.response.data.detail);
            } else {
                toast.error('Failed to complete purchase. Please try again.');
            }
        }
    });

    // React Query: Delete Auction Item
    const deleteMutation = useMutation({
        mutationFn: deleteAuctionItem,
        onSuccess: () => {
            // Invalidate auction list so it refreshes after deletion
            queryClient.invalidateQueries(['auctionItems']);
            toast.success('Auction item deleted successfully.');
            navigate('/');
        },
        onError: () => {
            toast.error('Failed to delete auction item.');
        }
    });

    if (isLoading) return <p>Loading...</p>;
    if (isError || !auctionItem) return <p>Failed to load auction item.</p>;

    // Determine if the current user can bid
    const canBid =
        user &&
        auctionItem.owner &&
        user.username !== auctionItem.owner.username &&
        auctionItem.status === 'active' &&
        !auctionItem.buy_now_buyer;

    // Determine if Buy Now is available
    const canBuyNow =
        user &&
        auctionItem.owner &&
        user.username !== auctionItem.owner.username &&
        auctionItem.status === 'active' &&
        auctionItem.buy_now_price &&
        !auctionItem.buy_now_buyer;

    // Calculate minimum bid (2% increment)
    const minBid = auctionItem.current_bid
        ? parseFloat(auctionItem.current_bid)
        : parseFloat(auctionItem.starting_bid);
    const minIncrement = minBid * 0.02;
    const minRequiredBid = (minBid + minIncrement).toFixed(2);

    // Format end time for display
    const formattedEndTime = moment(auctionItem.end_time).format(
        'MMMM Do YYYY, h:mm:ss a'
    );

    // Bid handler
    const handlePlaceBid = () => {
        const amount = parseFloat(bidAmount);
        if (isNaN(amount)) {
            toast.error('Please enter a valid bid amount.');
            return;
        }
        if (amount < minRequiredBid) {
            toast.error(`Bid must be at least $${minRequiredBid}.`);
            return;
        }
        bidMutation.mutate({ id: auctionItem.id, amount });
    };

    // Buy Now handler
    const handleBuyNow = () => {
        if (window.confirm('Are you sure you want to buy this item now?')) {
            buyNowMutation.mutate(auctionItem.id);
        }
    };

    // Delete handler
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this auction item?')) {
            deleteMutation.mutate(auctionItem.id);
        }
    };

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <CardContent>
                    {/* Title & Description */}
                    <Typography variant="h4" gutterBottom>
                        {auctionItem.title}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {auctionItem.description}
                    </Typography>

                    <Grid container spacing={2}>
                        {/* Images Section */}
                        <Grid item xs={12} md={6}>
                            {/* If multiple images exist, use ImageList. If only one, use CardMedia */}
                            {auctionItem.images && auctionItem.images.length > 0 ? (
                                <ImageList variant="masonry" cols={2} gap={8}>
                                    {auctionItem.images.map((img) => (
                                        <ImageListItem key={img.id}>
                                            <img
                                                src={img.image}
                                                alt={auctionItem.title}
                                                loading="lazy"
                                                className={styles.image}
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            ) : auctionItem.image ? (
                                <CardMedia
                                    component="img"
                                    image={auctionItem.image}
                                    alt={auctionItem.title}
                                    className={styles.image}
                                />
                            ) : (
                                <Typography variant="body2">
                                    No image available.
                                </Typography>
                            )}
                        </Grid>

                        {/* Auction Details & Actions */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6">
                                Starting Bid: ${auctionItem.starting_bid}
                            </Typography>
                            <Typography variant="h6">
                                Current Bid:{' '}
                                {auctionItem.current_bid
                                    ? `$${auctionItem.current_bid}`
                                    : 'No bids yet'}
                            </Typography>

                            {auctionItem.buy_now_price && (
                                <Typography variant="h6" color="secondary">
                                    Buy Now Price: ${auctionItem.buy_now_price}
                                </Typography>
                            )}

                            <Typography variant="body2">
                                <strong>Status:</strong> {auctionItem.status}
                            </Typography>
                            <Typography variant="body2">
                                <strong>End Time:</strong> {formattedEndTime}
                            </Typography>

                            {auctionItem.owner?.username && (
                                <Typography variant="body2">
                                    <strong>Owner:</strong> {auctionItem.owner.username}
                                </Typography>
                            )}

                            {auctionItem.buy_now_buyer?.username && (
                                <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
                                    Purchased via Buy Now by:{' '}
                                    {auctionItem.buy_now_buyer.username}
                                </Typography>
                            )}

                            {/* Bidding Section */}
                            {canBid && (
                                <Box className={styles.bidSection}>
                                    <Typography variant="subtitle1">
                                        Place Your Bid (Min: ${minRequiredBid}):
                                    </Typography>
                                    <TextField
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        inputProps={{
                                            min: minRequiredBid,
                                            step: '0.01'
                                        }}
                                        variant="outlined"
                                        size="small"
                                        className={styles.bidInput}
                                    />
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handlePlaceBid}
                                        className={styles.bidButton}
                                    >
                                        Bid
                                    </Button>
                                </Box>
                            )}

                            {/* Buy Now Section */}
                            {canBuyNow && (
                                <Box className={styles.buyNowSection}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleBuyNow}
                                        className={styles.buyNowButton}
                                    >
                                        Buy Now for ${auctionItem.buy_now_price}
                                    </Button>
                                </Box>
                            )}

                            {/* Update & Delete Buttons for Owner */}
                            {user?.username === auctionItem.owner?.username && (
                                <Box className={styles.buttonGroup}>
                                    {auctionItem.bids?.length > 0 ||
                                        auctionItem.buy_now_buyer ? (
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
                                                onClick={handleDelete}
                                                className={styles.button}
                                            >
                                                Delete
                                            </Button>
                                            <Link
                                                to={`/update/${auctionItem.id}`}
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    className={styles.button}
                                                >
                                                    Update
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </Box>
                            )}
                        </Grid>
                    </Grid>

                    {/* Bid History */}
                    <Box className={styles.bidHistory}>
                        <Typography variant="h6">Bid History:</Typography>
                        {auctionItem.bids && auctionItem.bids.length > 0 ? (
                            <ul>
                                {auctionItem.bids.map((bid) => (
                                    <li key={bid.id}>
                                        {bid.bidder?.username || ''} bid ${bid.amount} on{' '}
                                        {moment(bid.timestamp).format(
                                            'MMMM Do YYYY, h:mm:ss a'
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Typography variant="body2">No bids yet.</Typography>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProductDetails;
