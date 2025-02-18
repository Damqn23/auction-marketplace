import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAuctionItem,
  placeBid,
  buyNow,
  deleteAuctionItem,
} from '../services/auctionService';
import { UserContext } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Tooltip,
  Grid,
  Box,
  IconButton,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { keyframes } from '@emotion/react';

// Keyframe Animations
const gradientBackground = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// CountdownTimer Component
const CountdownTimer = ({ endTime }) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = new Date(endTime) - new Date();
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  }, [endTime]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (!timeLeft) {
    return <Typography component="span">Auction ended</Typography>;
  }

  return (
    <Typography component="span">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </Typography>
  );
};

// ImageSlider Component
const ImageSlider = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <IconButton
        onClick={handlePrev}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '20px',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          p: '10px',
          borderRadius: '50%',
          zIndex: 10,
          transition: 'background 0.3s ease, transform 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.7)',
            transform: 'translateY(-50%) scale(1.2)',
          },
        }}
      >
        <ArrowBackIosIcon fontSize="small" />
      </IconButton>
      <CardMedia
        component="img"
        image={images[currentIndex].image}
        alt={`Image ${currentIndex + 1}`}
        sx={{
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          transition: 'transform 0.5s ease',
        }}
      />
      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          p: '10px',
          borderRadius: '50%',
          zIndex: 10,
          transition: 'background 0.3s ease, transform 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.7)',
            transform: 'translateY(-50%) scale(1.2)',
          },
        }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

// ProductDetails Component
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState('');

  // Fetch single auction item
  const {
    data: auctionItem,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['auctionItem', id],
    queryFn: () => getAuctionItem(id),
    onError: () => {
      toast.error('Failed to load auction item.');
    },
  });

  // Place Bid Mutation
  const bidMutation = useMutation({
    mutationFn: placeBid,
    onSuccess: () => {
      queryClient.invalidateQueries(['auctionItem', id]);
      toast.success('Bid placed successfully!');
      setBidAmount('');
    },
    onError: (error) => {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to place bid. Please try again.');
      }
    },
  });

  // Buy Now Mutation
  const buyNowMutation = useMutation({
    mutationFn: buyNow,
    onSuccess: () => {
      queryClient.invalidateQueries(['auctionItem', id]);
      toast.success('Purchase successful!');
      navigate('/');
    },
    onError: (error) => {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to complete purchase. Please try again.');
      }
    },
  });

  // Delete Auction Item Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAuctionItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['auctionItems']);
      toast.success('Auction item deleted successfully.');
      navigate('/');
    },
    onError: () => {
      toast.error('Failed to delete auction item.');
    },
  });

  if (isLoading)
    return (
      <Typography variant="body1" sx={{ p: 2 }}>
        Loading...
      </Typography>
    );
  if (isError || !auctionItem)
    return (
      <Typography variant="body1" sx={{ p: 2 }}>
        Failed to load auction item.
      </Typography>
    );

  // Checks
  const canBid =
    user &&
    auctionItem.owner &&
    user.username !== auctionItem.owner.username &&
    auctionItem.status === 'active' &&
    !auctionItem.buy_now_buyer;

  const canBuyNow =
    user &&
    auctionItem.owner &&
    user.username !== auctionItem.owner.username &&
    auctionItem.status === 'active' &&
    auctionItem.buy_now_price &&
    !auctionItem.buy_now_buyer;

  // Minimum bid logic
  const minBid = auctionItem.current_bid
    ? parseFloat(auctionItem.current_bid)
    : parseFloat(auctionItem.starting_bid);
  const minIncrement = minBid * 0.02;
  const minRequiredBid = (minBid + minIncrement).toFixed(2);

  // Place a bid
  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      toast.error('Please enter a valid bid amount.');
      return;
    }
    if (amount < minRequiredBid) {
      toast.error(`Bid must be at least $${minRequiredBid}.`);
      return;
    }
    bidMutation.mutate({ id: auctionItem.id, amount });
  };

  // Buy Now
  const handleBuyNow = () => {
    if (window.confirm('Are you sure you want to buy this item now?')) {
      buyNowMutation.mutate(auctionItem.id);
    }
  };

  // Delete
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this auction item?')) {
      deleteMutation.mutate(auctionItem.id);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(270deg, #001f3f, #0074D9, #7FDBFF)',
        backgroundSize: '600% 600%',
        animation: `${gradientBackground} 16s ease infinite`,
        p: 0,
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1400px',
          mx: 'auto',
          background: 'rgba(255, 255, 255, 0.95)',
          p: 4,
          boxSizing: 'border-box',
        }}
      >
        <Card sx={{ p: 2 }}>
          <CardContent>
            {/* Title & Description */}
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              {auctionItem.title}
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              sx={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#555', mb: 3 }}
            >
              {auctionItem.description}
            </Typography>

            <Grid container spacing={2}>
              {/* Left Column: Images */}
              <Grid item xs={12} md={6}>
                {auctionItem.images && auctionItem.images.length > 1 ? (
                  <ImageSlider images={auctionItem.images} />
                ) : auctionItem.images?.length === 1 ? (
                  <CardMedia
                    component="img"
                    image={auctionItem.images[0].image}
                    alt={auctionItem.title}
                    sx={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                  />
                ) : auctionItem.image ? (
                  <CardMedia
                    component="img"
                    image={auctionItem.image}
                    alt={auctionItem.title}
                    sx={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                  />
                ) : (
                  <Typography variant="body2">No image available.</Typography>
                )}
              </Grid>

              {/* Right Column: Details */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      {auctionItem.category_data && (
                        <Typography variant="body2">
                          <strong>Category:</strong> {auctionItem.category_data.name}
                        </Typography>
                      )}
                      {auctionItem.condition && (
                        <Typography variant="body2">
                          <strong>Condition:</strong> {auctionItem.condition}
                        </Typography>
                      )}
                      {auctionItem.location && (
                        <Typography variant="body2">
                          <strong>Location:</strong> {auctionItem.location}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Status:</strong> {auctionItem.status}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Time Remaining:</strong>{' '}
                        <CountdownTimer endTime={auctionItem.end_time} />
                      </Typography>
                      {auctionItem.owner?.username && (
                        <Typography variant="body2">
                          <strong>Owner:</strong> {auctionItem.owner.username}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>

                  <Box
                    sx={{
                      mt: 2,
                      borderTop: '2px solid #eee',
                      pt: 2,
                      fontSize: '1.2rem',
                      color: '#333',
                    }}
                  >
                    <Typography variant="h6">
                      <strong>Starting Bid:</strong> ${auctionItem.starting_bid}
                    </Typography>
                    <Typography variant="h6">
                      <strong>Current Bid:</strong>{' '}
                      {auctionItem.current_bid ? `$${auctionItem.current_bid}` : 'No bids yet'}
                    </Typography>
                    {auctionItem.buy_now_price && (
                      <Typography variant="h6" sx={{ color: '#e91e63', fontWeight: 'bold' }}>
                        <strong>Buy Now Price:</strong> ${auctionItem.buy_now_price}
                      </Typography>
                    )}
                  </Box>

                  {auctionItem.buy_now_buyer?.username && (
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      Purchased via Buy Now by: {auctionItem.buy_now_buyer.username}
                    </Typography>
                  )}

                  {/* Bidding Section */}
                  {canBid && (
                    <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle1">
                        Place Your Bid (Min: ${minRequiredBid}):
                      </Typography>
                      <TextField
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        inputProps={{
                          min: minRequiredBid,
                          step: '0.01',
                        }}
                        variant="outlined"
                        size="small"
                        sx={{
                          width: '150px',
                          transition: 'border-color 0.3s ease, transform 0.3s ease',
                          '& input': { p: '10px' },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handlePlaceBid}
                        sx={{
                          backgroundColor: '#4caf50',
                          color: '#fff',
                          textTransform: 'none',
                          '&:hover': { transform: 'scale(1.05)' },
                        }}
                      >
                        Bid
                      </Button>
                    </Box>
                  )}

                  {/* Buy Now Section */}
                  {canBuyNow && (
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={handleBuyNow}
                        sx={{
                          backgroundColor: '#ff5722',
                          color: '#fff',
                          textTransform: 'none',
                          '&:hover': { transform: 'scale(1.05)' },
                        }}
                      >
                        Buy Now for ${auctionItem.buy_now_price}
                      </Button>
                    </Box>
                  )}

                  {/* Owner Actions */}
                  {user?.username === auctionItem.owner?.username && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      {auctionItem.bids?.length > 0 || auctionItem.buy_now_buyer ? (
                        <Tooltip title="Cannot delete auction items that have received bids or been purchased via Buy Now.">
                          <span>
                            <Button variant="outlined" disabled>
                              Delete
                            </Button>
                          </span>
                        </Tooltip>
                      ) : (
                        <>
                          <Button variant="outlined" onClick={handleDelete}>
                            Delete
                          </Button>
                          <Link to={`/update/${auctionItem.id}`} style={{ textDecoration: 'none' }}>
                            <Button variant="outlined">Update</Button>
                          </Link>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Bid History */}
            <Box
              sx={{
                mt: 4,
                p: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '5px',
                animation: `${fadeIn} 1s ease-in`,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Bid History:
              </Typography>
              {auctionItem.bids?.length ? (
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {auctionItem.bids.map((bid) => (
                    <Box
                      component="li"
                      key={bid.id}
                      sx={{
                        py: 1.5,
                        borderBottom: '1px solid #eee',
                        fontSize: '1rem',
                        color: '#555',
                        '&:last-of-type': { borderBottom: 'none' },
                      }}
                    >
                      {bid.bidder?.username || ''} bid ${bid.amount} on{' '}
                      {moment(bid.timestamp).format('MMMM Do YYYY, h:mm:ss a')}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2">No bids yet.</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ProductDetails;
