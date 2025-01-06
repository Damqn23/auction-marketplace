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
    const [image, setImage] = useState(null);
    const [endTime, setEndTime] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        // Validation: Buy Now price must be higher than starting bid
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

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('starting_bid', startingBid);
        formData.append('buy_now_price', buyNowPrice);
        formData.append('end_time', endTime);
        if (image) {
            formData.append('image', image);
        }

        try {
            await createAuctionItem(formData);
            setMessage('Auction item created successfully');
            toast.success('Auction item created successfully!');
            navigate('/'); // Redirect to Auction List
        } catch (err) {
            setMessage('Error creating auction item');
            console.error('Error:', err);
            toast.error('Failed to create auction item. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <h2>Create New Auction Item</h2>
            {message && <p className={styles.message}>{message}</p>}
            <form onSubmit={handleSubmit}>
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
                <div className={styles.formGroup}>
                    <label className={styles.label}>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows="4"
                        className={`${styles.input} ${styles.textarea}`}
                    ></textarea>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Starting Bid:</label>
                    <input
                        type="number"
                        value={startingBid}
                        onChange={(e) => setStartingBid(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className={`${styles.input}`}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>End Time:</label>
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className={`${styles.input}`}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Image:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                        className={`${styles.input}`}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Buy Now Price:</label>
                    <input
                        type="number"
                        value={buyNowPrice}
                        onChange={(e) => setBuyNowPrice(e.target.value)}
                        min={parseFloat(startingBid) + 0.01}
                        step="0.01"
                        className={`${styles.input}`}
                        placeholder="Optional"
                    />
                </div>
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
