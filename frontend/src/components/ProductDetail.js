// frontend/src/components/ProductDetail.js

import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { getAuctionItem, placeBid, buyNow } from '../services/auctionService';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import { Button, Card, CardContent, Typography, TextField } from '@mui/material';
import styles from './ProductDetail.module.css'; // Ensure this CSS Module exists and is properly styled
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Import carousel CSS
import { Carousel as ResponsiveCarousel } from 'react-responsive-carousel';
import BuyNowModal from './BuyNowModal'; // Ensure BuyNowModal component exists

const ProductDetail = () => {
    const { id } = useParams();
    const { user } = useContext(UserContext);
    const [auctionItem, setAuctionItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bidAmount, setBidAmount] = useState('');

    // States for Buy Now Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetchAuctionItem();
        // eslint-disable-next-line
    }, [id]);

    const fetchAuctionItem = async () => {
        try {
            const data = await getAuctionItem(id);
            console.log('Fetched Auction Item:', data); // Debugging line
            setAuctionItem(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching auction item:', err); // Debugging line
            setError('Failed to load auction item.');
            setLoading(false);
            toast.error('Failed to load auction item.');
        }
    };

    const handleBidChange = (e) => {
        setBidAmount(e.target.value);
    };

    const handlePlaceBid = async () => {
        const bidValue = parseFloat(bidAmount);
        if (isNaN(bidValue)) {
            toast.error('Please enter a valid bid amount.');
            return;
        }

        try {
            await placeBid(id, bidValue);
            toast.success('Bid placed successfully!');
            fetchAuctionItem(); // Refresh the auction item details
            setBidAmount('');
        } catch (err) {
            console.error('Error placing bid:', err);
            if (err.response && err.response.data.detail) { // Adjusted based on DRF response
                toast.error(err.response.data.detail);
            } else if (err.detail) { // For direct DRF errors
                toast.error(err.detail);
            } else {
                toast.error('Failed to place bid. Please try again.');
            }
        }
    };

    // Handlers for Buy Now Modal
    const openBuyNowModal = (item) => {
        setSelectedItem(item);
        setModalOpen(true);
    };

    const closeBuyNowModal = () => {
        setSelectedItem(null);
        setModalOpen(false);
    };

    const handleConfirmBuyNow = async () => {
        if (!selectedItem) return;

        try {
            await buyNow(selectedItem.id);
            toast.success('Purchase successful!');
            fetchAuctionItem(); // Refresh the auction item details
        } catch (err) {
            console.error('Error buying now:', err);
            if (err.response && err.response.data.detail) { // Adjusted based on DRF response
                toast.error(err.response.data.detail);
            } else if (err.detail) { // For direct DRF errors
                toast.error(err.detail);
            } else {
                toast.error('Failed to complete purchase. Please try again.');
            }
        }
        closeBuyNowModal();
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!auctionItem) return <p>Auction item not found.</p>;

    // Corrected conditional checks with additional null checks
    const canBid = user && auctionItem.owner && user.username !== auctionItem.owner.username && auctionItem.status === 'active' && !auctionItem.buy_now_buyer;
    const canBuyNow = user && auctionItem.owner && user.username !== auctionItem.owner.username && auctionItem.status === 'active' && auctionItem.buy_now_price && !auctionItem.buy_now_buyer;

    const minBid = auctionItem.current_bid ? parseFloat(auctionItem.current_bid) : parseFloat(auctionItem.starting_bid);
    const minIncrement = minBid * 0.02;
    const minRequiredBid = (minBid + minIncrement).toFixed(2);

    const formattedEndTime = moment(auctionItem.end_time).format('MMMM Do YYYY, h:mm:ss a');

    return (
        <div className={styles.container}>
            <Card className={styles.detailCard}>
                <CardContent>
                    <Typography variant="h4">{auctionItem.title}</Typography>
                    <Typography variant="body1">{auctionItem.description}</Typography>
                    <Typography variant="body2">Starting Bid: ${auctionItem.starting_bid}</Typography>
                    <Typography variant="body2">Current Bid: ${auctionItem.current_bid || 'No bids yet'}</Typography>

                    {/* Display images using Carousel */}
                    {auctionItem.images && auctionItem.images.length > 0 ? (
                        <ResponsiveCarousel showThumbs={true} dynamicHeight={true}>
                            {auctionItem.images.map((img) => (
                                <div key={img.id}>
                                    <img src={img.image} alt={auctionItem.title} />
                                </div>
                            ))}
                        </ResponsiveCarousel>
                    ) : (
                        auctionItem.image && <img src={auctionItem.image} alt={auctionItem.title} className={styles.primaryImage} />
                    )}

                    <Typography variant="body2">Status: {auctionItem.status}</Typography>
                    <Typography variant="body2">End Time: {formattedEndTime}</Typography>

                    {/* Accessing owner's username with null check */}
                    {auctionItem.owner && (
                        <Typography variant="body2">Owner: {auctionItem.owner.username}</Typography>
                    )}

                    {auctionItem.buy_now_price && (
                        <Typography variant="body1" color="secondary">
                            Buy Now Price: ${auctionItem.buy_now_price}
                        </Typography>
                    )}

                    {auctionItem.buy_now_buyer && (
                        <Typography variant="body1" color="primary">
                            Purchased by: {auctionItem.buy_now_buyer.username}
                        </Typography>
                    )}

                    {auctionItem.winner && (
                        <Typography variant="body1" color="primary">
                            Winner: {auctionItem.winner.username}
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Bidding Section */}
            {canBid && (
                <div className={styles.biddingSection}>
                    <Typography variant="h6">Place Your Bid (Min: ${minRequiredBid}):</Typography>
                    <TextField
                        type="number"
                        value={bidAmount}
                        onChange={handleBidChange}
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
                        onClick={handlePlaceBid}
                        className={styles.bidButton}
                    >
                        Bid
                    </Button>
                </div>
            )}

            {/* Buy Now Section */}
            {canBuyNow && (
                <div className={styles.buyNowSection}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => openBuyNowModal(auctionItem)}
                        className={styles.buyNowButton}
                    >
                        Buy Now for ${auctionItem.buy_now_price}
                    </Button>
                </div>
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

export default ProductDetail;
