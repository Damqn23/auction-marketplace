import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useTheme,
  Slide,
  Fade,
  styled,
} from '@mui/material';
import { Close as CloseIcon, ShoppingCart, CheckCircle } from '@mui/icons-material';
import { keyframes } from '@emotion/react';

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    padding: theme.spacing(2),
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    animation: `${slideUp} 0.3s ease-out`,
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 30,
  padding: '10px 24px',
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  '&.MuiButton-containedPrimary': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    },
  },
  '&.MuiButton-outlined': {
    borderColor: theme.palette.grey[300],
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
  },
}));

const BuyNowModal = ({ open, onClose, onConfirm, item }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!item) return null;

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: -8,
            top: -8,
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <DialogTitle sx={{ textAlign: 'center', pt: 2 }}>
          <Fade in timeout={500}>
            <ShoppingCart
              sx={{
                fontSize: 48,
                color: theme.palette.primary.main,
                mb: 2,
              }}
            />
          </Fade>
          <Typography variant="h5" component="div" fontWeight="bold">
            Confirm Purchase
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="h6" gutterBottom>
              {item.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Are you sure you want to buy this item now?
            </Typography>
            <Typography
              variant="h4"
              color="primary"
              fontWeight="bold"
              sx={{
                mt: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              ${item.buy_now_price}
              <CheckCircle
                sx={{
                  fontSize: 28,
                  color: theme.palette.success.main,
                  ml: 1,
                }}
              />
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <StyledButton
            variant="outlined"
            onClick={onClose}
            sx={{ minWidth: 120 }}
          >
            Cancel
          </StyledButton>
          <StyledButton
            variant="contained"
            color="primary"
            onClick={onConfirm}
            sx={{ minWidth: 120 }}
          >
            Buy Now
          </StyledButton>
        </DialogActions>
      </Box>
    </StyledDialog>
  );
};

export default BuyNowModal;
