// src/components/UpdateAuction.js

import React, { useState, useEffect } from 'react';
import { getAuctionItem, updateAuctionItem } from '../services/auctionService';
import { useParams, useNavigate } from 'react-router-dom'; // v6/v7

const UpdateAuction = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // v6/v7

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingBid, setStartingBid] = useState('');
    const [image, setImage] = useState(null);
    const [status, setStatus] = useState('active');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchAuctionItem();
        // eslint-disable-next-line
    }, []);

    const fetchAuctionItem = async () => {
        try {
            const response = await getAuctionItem(id);
            const data = response.data;
            setTitle(data.title);
            setDescription(data.description);
            setStartingBid(data.starting_bid);
            setStatus(data.status);
            // Note: Image is optional to update
        } catch (err) {
            setMessage('Error fetching auction item');
            console.error('Error:', err);
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
            // Redirect to Auction List
            navigate('/');
        } catch (err) {
            setMessage('Error updating auction item');
            console.error('Error:', err);
        }
    };

    return (
        <div>
            <h2>Update Auction Item</h2>
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
                {message && <p>{message}</p>}
                <button type="submit">Update Auction</button>
            </form>
        </div>
    );
};

export default UpdateAuction;
