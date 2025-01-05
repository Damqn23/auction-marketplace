import React, { useState } from 'react';
import { createAuctionItem } from '../services/auctionService';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css';        // Import react-toastify CSS
import styles from './CreateAuction.module.css';        // Import CSS Module

const CreateAuction = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingBid, setStartingBid] = useState('');
    const [image, setImage] = useState(null);
    const [status, setStatus] = useState('active');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic form validation
        if (!title || !description || !startingBid) {
            toast.error('Please fill in all required fields.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('starting_bid', startingBid);
        formData.append('status', status);
        if (image) {
            formData.append('image', image);
        }

        try {
            await createAuctionItem(formData);
            toast.success('Auction item created successfully!');
            // Reset form fields
            setTitle('');
            setDescription('');
            setStartingBid('');
            setImage(null);
            setStatus('active');
            // Redirect to auction list
            navigate('/');
        } catch (error) {
            console.error('Error creating auction item:', error);
            toast.error('Failed to create auction item. Please try again.');
        }
    };

    return (
        <div className={styles.container}>
            <h2>Create Auction Item</h2>
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
                        className={styles.input}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Image:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                        className={styles.input}
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
                <button type="submit" className={styles.button}>Create Auction</button>
            </form>
            <ToastContainer /> {/* Include ToastContainer to display toasts */}
        </div>
    );
};

export default CreateAuction;
