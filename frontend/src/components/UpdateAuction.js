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
    const [status, setStatus] = useState('active');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

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
            setTitle(data.title);
            setDescription(data.description);
            setStartingBid(data.starting_bid);
            setStatus(data.status);
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
        formData.append('status', status);
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

    return (
        <div className={styles.container}>
            <h2>Update Auction Item</h2>
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
                <div className={styles.formGroup}>
                    <label className={styles.label}>Status:</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className={`${styles.input} ${styles.select}`}
                    >
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                {message && <p className={styles.message}>{message}</p>}
                <button type="submit" className={styles.button}>Update Auction</button>
            </form>
        </div>
    );
};

export default UpdateAuction;
