// frontend/src/components/CreateAuction.js

import React, { useState, useContext } from 'react';
import { createAuctionItem } from '../services/auctionService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './CreateAuction.module.css';
import { UserContext } from '../contexts/UserContext';
import {
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Box
} from '@mui/material';

const CreateAuction = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingBid, setStartingBid] = useState('');
    const [buyNowPrice, setBuyNowPrice] = useState('');
    const [images, setImages] = useState([]); // Allow multiple image files
    const [endTime, setEndTime] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    // Handle file selection
    const handleImageChange = (e) => {
        const filesArray = Array.from(e.target.files);
        setImages(filesArray);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        // Simple validation: buyNowPrice > startingBid (if user set it)
        if (buyNowPrice && parseFloat(buyNowPrice) <= parseFloat(startingBid)) {
            setMessage('Buy Now price must be higher than the starting bid.');
            setLoading(false);
            return;
        }

        if (!endTime) {
            setMessage('End time is required.');
            setLoading(false);
            return;
        }

        // Build FormData for backend
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('starting_bid', startingBid);
        formData.append('buy_now_price', buyNowPrice);
        formData.append('end_time', endTime);

        images.forEach((imageFile) => {
            formData.append('images', imageFile);
        });

        try {
            await createAuctionItem(formData);
            toast.success('Auction item created successfully!');
            navigate('/');
        } catch (err) {
            setMessage('Error creating auction item');
            console.error('Error:', err);
            toast.error('Failed to create auction item. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className={styles.wrapper}>
            <Paper elevation={3} className={styles.container}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Create New Auction Item
                </Typography>

                {message && (
                    <Typography variant="body1" color="error" className={styles.message}>
                        {message}
                    </Typography>
                )}

                <form
                    onSubmit={handleSubmit}
                    className={styles.form}
                    encType="multipart/form-data"
                >
                    {/* Title */}
                    <TextField
                        label="Title"
                        variant="outlined"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        margin="normal"
                    />

                    {/* Description */}
                    <TextField
                        label="Description"
                        variant="outlined"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                        required
                        margin="normal"
                    />

                    {/* Starting Bid */}
                    <TextField
                        label="Starting Bid"
                        variant="outlined"
                        type="number"
                        value={startingBid}
                        onChange={(e) => setStartingBid(e.target.value)}
                        required
                        fullWidth
                        margin="normal"
                        inputProps={{ min: '0', step: '0.01' }}
                    />

                    {/* End Time */}
                    <TextField
                        label="End Time"
                        variant="outlined"
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        fullWidth
                        margin="normal"
                        InputLabelProps={{
                            shrink: true, // keeps label shrunk when date/time value is set
                        }}
                    />

                    {/* Images */}
                    <Box mt={2} mb={2}>
                        <Typography variant="body1" gutterBottom>
                            Upload Images (optional, multiple allowed):
                        </Typography>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                        />
                    </Box>

                    {/* Buy Now Price (optional) */}
                    <TextField
                        label="Buy Now Price (Optional)"
                        variant="outlined"
                        type="number"
                        value={buyNowPrice}
                        onChange={(e) => setBuyNowPrice(e.target.value)}
                        fullWidth
                        margin="normal"
                        inputProps={{ min: parseFloat(startingBid) + 0.01 || 0, step: '0.01' }}
                    />

                    {/* Submit */}
                    <Box mt={3} display="flex" justifyContent="flex-end">
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <CircularProgress size={24} style={{ color: '#fff' }} />
                            ) : (
                                'Create Auction'
                            )}
                        </Button>
                    </Box>
                </form>

                <Box mt={2}>
                    <Link to="/" className={styles.backLink}>
                        Back to Auction List
                    </Link>
                </Box>
            </Paper>
        </div>
    );
};

export default CreateAuction;
