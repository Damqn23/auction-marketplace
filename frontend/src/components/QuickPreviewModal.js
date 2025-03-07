import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';

const QuickPreviewModal = ({ open, onClose, item }) => {
  const navigate = useNavigate();

  if (!item) return null;

  const handleViewDetails = () => {
    navigate(`/auction/${item.id}`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" component="div">
          Quick Preview
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Image */}
          <Grid item xs={12}>
            <Box
              sx={{
                width: '100%',
                height: 200,
                borderRadius: 1,
                overflow: 'hidden',
                position: 'relative',
                '& img': {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }
              }}
            >
              <img 
                src={item.images?.[0]?.image || '/placeholder.jpg'} 
                alt={item.title}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  gap: 1,
                }}
              >
                <Chip
                  label={item.status}
                  color={item.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
                {item.buy_now_price && (
                  <Chip
                    label="Buy Now Available"
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
            </Box>
          </Grid>

          {/* Title and Description */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {item.description?.substring(0, 150)}...
            </Typography>
          </Grid>

          {/* Price and Timer */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Bid
                </Typography>
                <Typography variant="h5" color="primary">
                  ${item.current_bid || item.starting_bid}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" align="right">
                  Time Left
                </Typography>
                <CountdownTimer endTime={item.end_time} />
              </Box>
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                fullWidth
              >
                Close
              </Button>
              <Button
                variant="contained"
                onClick={handleViewDetails}
                fullWidth
              >
                View Details
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default QuickPreviewModal; 