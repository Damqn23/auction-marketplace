// frontend/src/components/CreateAuction.js

import React, { useState } from 'react';
import { createAuctionItem } from '../services/auctionService';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css';        // Import react-toastify CSS

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
        <div>
            <h2>Create Auction Item</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title:</label><br />
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ width: '300px' }}
                    />
                </div>
                <div>
                    <label>Description:</label><br />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows="4"
                        cols="50"
                        style={{ width: '300px' }}
                    ></textarea>
                </div>
                <div>
                    <label>Starting Bid:</label><br />
                    <input
                        type="number"
                        value={startingBid}
                        onChange={(e) => setStartingBid(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        style={{ width: '300px' }}
                    />
                </div>
                <div>
                    <label>Image:</label><br />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                    />
                </div>
                <div>
                    <label>Status:</label><br />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ width: '310px' }}
                    >
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <button type="submit" style={{ marginTop: '10px' }}>Create Auction</button>
            </form>
            <ToastContainer /> {/* Include ToastContainer to display toasts */}
        </div>
    );
};

export default CreateAuction;
