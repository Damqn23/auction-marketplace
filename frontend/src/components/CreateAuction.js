// frontend/src/components/CreateAuction.js

import React, { useState, useContext } from 'react';
import { createAuctionItem } from '../services/auctionService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './CreateAuction.module.css';
import { UserContext } from '../contexts/UserContext';

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

        // Build FormData object to send to the backend
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('starting_bid', startingBid);
        formData.append('buy_now_price', buyNowPrice);
        formData.append('end_time', endTime);

        // Append each selected file under the key "images"
        images.forEach((imageFile) => {
            formData.append('images', imageFile);
        });

        try {
            await createAuctionItem(formData);
            setMessage('Auction item created successfully');
            toast.success('Auction item created successfully!');
            navigate('/'); // Redirect back to your main listing or wherever
        } catch (err) {
            setMessage('Error creating auction item');
            console.error('Error:', err);
            toast.error('Failed to create auction item. Please try again.');
        }
        setLoading(false);
    };

    // Handle file selection
    const handleImageChange = (e) => {
        const filesArray = Array.from(e.target.files); // convert FileList to an array
        setImages(filesArray);
    };

    return (
        <div className={styles.container}>
            <h2>Create New Auction Item</h2>
            {message && <p className={styles.message}>{message}</p>}

            <form
                onSubmit={handleSubmit}
                className={styles.form}
                encType="multipart/form-data" // <-- Important for file uploads
            >
                {/* Title */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows="4"
                        className={`${styles.input} ${styles.textarea}`}
                    />
                </div>

                {/* Starting Bid */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Starting Bid:</label>
                    <input
                        type="number"
                        value={startingBid}
                        onChange={(e) => setStartingBid(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className={styles.input}
                    />
                </div>

                {/* End Time */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>End Time:</label>
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                {/* Images */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Images:</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple                  // <-- Allows multiple file selections
                        onChange={handleImageChange}
                        className={styles.input}
                    />
                </div>

                {/* Buy Now Price (optional) */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Buy Now Price:</label>
                    <input
                        type="number"
                        value={buyNowPrice}
                        onChange={(e) => setBuyNowPrice(e.target.value)}
                        min={parseFloat(startingBid) + 0.01 || 0}
                        step="0.01"
                        className={styles.input}
                        placeholder="Optional"
                    />
                </div>

                {/* Submit */}
                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Auction'}
                </button>
            </form>

            <p style={{ marginTop: '10px' }}>
                <Link to="/">Back to Auction List</Link>
            </p>
        </div>
    );
};

export default CreateAuction;
