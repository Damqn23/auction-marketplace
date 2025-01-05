import React, { useState, useEffect, useContext } from 'react';
import { getAuctionItem, updateAuctionItem } from '../services/auctionService';
import { useParams, useNavigate } from 'react-router-dom'; // v6/v7
import styles from './UpdateAuction.module.css'; // Import CSS Module
import { UserContext } from '../contexts/UserContext'; // Import UserContext
import { toast } from 'react-toastify'; // For toast notifications

const UpdateAuction = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // v6/v7
    const { user } = useContext(UserContext); // Access current user

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingBid, setStartingBid] = useState('');
    const [image, setImage] = useState(null);
    // Removed status state as it's now read-only
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [hasBids, setHasBids] = useState(false); // New state to track if auction has bids

    useEffect(() => {
        fetchAuctionItem();
        // eslint-disable-next-line
    }, []);

    const fetchAuctionItem = async () => {
        try {
            const response = await getAuctionItem(id);
            const data = response.data;
            // Check ownership
            if (user && user.username !== data.owner) {
                toast.error('You are not authorized to update this auction item.');
                navigate('/');
                return;
            }
            // Check if auction has bids
            if (data.bids && data.bids.length > 0) {
                setHasBids(true);
                toast.info('This auction has received bids and cannot be updated.');
                setLoading(false);
                return;
            }
            // Optionally, check if the auction has already ended
            if (new Date(data.end_time) <= new Date()) {
                setHasBids(true);
                toast.info('This auction has already ended and cannot be updated.');
                setLoading(false);
                return;
            }
            setTitle(data.title);
            setDescription(data.description);
            setStartingBid(data.starting_bid);
            setLoading(false);
        } catch (err) {
            setMessage('Error fetching auction item');
            console.error('Error:', err);
            toast.error('Error fetching auction item.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('starting_bid', startingBid);
        // Removed status as it's read-only
        if (image) {
            formData.append('image', image);
        }

        try {
            await updateAuctionItem(id, formData);
            setMessage('Auction item updated successfully');
            toast.success('Auction item updated successfully!');
            // Redirect to Auction List
            navigate('/');
        } catch (err) {
            setMessage('Error updating auction item');
            console.error('Error:', err);
            toast.error('Failed to update auction item. Please try again.');
        }
    };

    if (loading) return <p>Loading...</p>;

    if (hasBids) {
        return (
            <div className={styles.container}>
                <h2>Update Auction Item</h2>
                <p>This auction has received bids and cannot be updated.</p>
                <p>
                    <button onClick={() => navigate('/')} className={styles.button}>
                        Back to Auction List
                    </button>
                </p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2>Update Auction Item</h2>
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
                    <label className={styles.label}>Image:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                        className={`${styles.input}`}
                    />
                </div>
                {/* Removed Status Field */}
                {message && <p className={styles.message}>{message}</p>}
                <button type="submit" className={styles.button}>Update Auction</button>
            </form>
            <p style={{ marginTop: '10px' }}>
                <button onClick={() => navigate('/')} className={styles.button}>
                    Back to Auction List
                </button>
            </p>
        </div>
    );

};

export default UpdateAuction;
