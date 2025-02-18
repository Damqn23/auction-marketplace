import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import PropTypes from "prop-types";
import { keyframes } from "@emotion/react";

// Optional: a subtle fade-in animation for the modal content
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  animation: `${fadeIn} 0.5s ease-out`,
};

const BuyNowModal = ({ open, handleClose, handleConfirm, buyNowPrice }) => {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="buy-now-modal-title"
      aria-describedby="buy-now-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="buy-now-modal-title" variant="h6" component="h2">
          Confirm Purchase
        </Typography>
        <Typography id="buy-now-modal-description" sx={{ mt: 2 }}>
          Are you sure you want to buy this item for ${buyNowPrice}?
        </Typography>
        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleConfirm}
            sx={{ mr: 2, textTransform: "none" }}
          >
            Yes, Buy Now
          </Button>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

BuyNowModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleConfirm: PropTypes.func.isRequired,
  buyNowPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default BuyNowModal;
