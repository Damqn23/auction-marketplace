import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import styles from './BuyNowModal.module.css';

const BuyNowModal = ({ open, handleClose, handleConfirm, buyNowPrice }) => {
    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="buy-now-modal-title"
            aria-describedby="buy-now-modal-description"
        >
            <Box className={styles.modalBox}>
                <Typography id="buy-now-modal-title" variant="h6" component="h2">
                    Confirm Buy Now Purchase
                </Typography>
                <Typography id="buy-now-modal-description" sx={{ mt: 2 }}>
                    Are you sure you want to buy this item now for <strong>${buyNowPrice}</strong>?
                </Typography>
                <div className={styles.buttonGroup}>
                    <Button variant="contained" color="primary" onClick={handleConfirm}>
                        Yes, Buy Now
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                </div>
            </Box>
        </Modal>
    );
};

export default BuyNowModal;
