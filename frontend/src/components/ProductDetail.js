import React, { useContext, useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';
import {
  calculateMinBid,
  canUserBid,
  canUserBuyNow,
  validateBidAmount,
  getCurrentBidAmount,
} from "../utils/biddingUtils";

import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Fade,
  Divider,
  Paper,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import {
  getAuctionItem,
  placeBid,
  buyNow,
  deleteAuctionItem,
  getSimilarAuctions,
} from "../services/auctionService";
import { UserContext } from "../contexts/UserContext";

// ----------------------
// Countdown Timer Component
// ----------------------
const CountdownTimer = ({ endTime }) => {
  const { t } = useTranslation();
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
    return <Typography component="span">{t('auction.auctionEnded')}</Typography>;
  }

  return (
    <Typography component="span">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </Typography>
  );
};

// ----------------------
// Image Slider Component
// ----------------------
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
    <Box sx={{ position: "relative", width: "100%", overflow: "hidden" }}>
      {images.length > 1 && (
        <>
          <IconButton
            onClick={handlePrev}
            sx={{
              position: "absolute",
              top: "50%",
              left: "20px",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#fff",
              p: "10px",
              borderRadius: "50%",
              zIndex: 10,
              transition: "background 0.3s ease, transform 0.3s ease",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.7)",
                transform: "translateY(-50%) scale(1.2)",
              },
            }}
          >
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              position: "absolute",
              top: "50%",
              right: "20px",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#fff",
              p: "10px",
              borderRadius: "50%",
              zIndex: 10,
              transition: "background 0.3s ease, transform 0.3s ease",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.7)",
                transform: "translateY(-50%) scale(1.2)",
              },
            }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </>
      )}
      <CardMedia
        component="img"
        image={images[currentIndex].image}
        alt={`Image ${currentIndex + 1}`}
        sx={{
          width: "100%",
          height: "auto",
          objectFit: "cover",
          transition: "transform 0.5s ease",
        }}
      />
    </Box>
  );
};

// ----------------------
// ProductDetails Component
// ----------------------
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [bidAmount, setBidAmount] = useState("");

  // 1) Fetch main auction item with polling for live updates
  const {
    data: auctionItem,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["auctionItem", id],
    queryFn: () => getAuctionItem(id),
    onError: () => toast.error(t("auction.toasts.loadFailed")),
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  // 2) Fetch similar auctions
  const { data: similarAuctions } = useQuery({
    queryKey: ["similarAuctions", auctionItem?.category_data?.name],
    queryFn: () => getSimilarAuctions(auctionItem?.category_data?.name, auctionItem.id),
    enabled: !!auctionItem,
  });

  // ----- Mutations -----
  const bidMutation = useMutation({
    mutationFn: placeBid,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItem", id]);
      toast.success(t("auction.toasts.bidPlaced"));
      setBidAmount("");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to place bid. Please try again.");
    },
  });

  const buyNowMutation = useMutation({
    mutationFn: buyNow,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItem", id]);
      toast.success(t("auction.toasts.purchaseSuccess"));
      navigate("/");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to complete purchase. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuctionItem,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success(t("auction.toasts.deleteSuccess"));
      navigate("/");
    },
    onError: () => {
      toast.error(t("auction.toasts.deleteFailed"));
    },
  });

  // ----- Loading/Error states -----
  if (isLoading)
    return <Typography variant="body1" sx={{ p: 2 }}>{t('common.loading')}</Typography>;
  if (isError || !auctionItem)
    return <Typography variant="body1" sx={{ p: 2 }}>{t('auction.toasts.loadFailed')}</Typography>;

  // ----- Permissions -----
  const canBid = canUserBid(user, auctionItem);
  const canBuyNow = canUserBuyNow(user, auctionItem);

  // ----- Minimum Bid Logic -----
  const minRequiredBid = calculateMinBid(auctionItem);

  // ----- Handlers -----
  const handlePlaceBid = () => {
    const validation = validateBidAmount(bidAmount, minRequiredBid);
    
    if (!validation.valid) {
      if (validation.error === 'invalidBid') {
        toast.error(t('auction.invalidBid'));
      } else if (validation.error === 'bidTooLow') {
        toast.error(t('auction.toasts.bidFailed'));
      }
      return;
    }
    
    bidMutation.mutate({ id: auctionItem.id, amount: parseFloat(bidAmount) });
  };

  const handleBuyNow = () => {
    if (window.confirm(t('auction.confirmBuyNow'))) {
      buyNowMutation.mutate(auctionItem.id);
    }
  };

  const handleDelete = () => {
    if (window.confirm(t("auction.confirmDelete"))) {
      deleteMutation.mutate(auctionItem.id);
    }
  };

  return (
    <Box sx={{ pt: { xs: '88px', sm: '96px' }, p: 3, backgroundColor: "#f7f7f7", minHeight: "100vh" }}>
      <Fade in timeout={900}>
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            backgroundColor: "#ffffff",
            borderRadius: 2,
            boxShadow: 3,
            p: 2,
          }}
        >
          {/* Top Row: Images on the left, Key Info on the right */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Left: Image/Slider */}
            <Grid item xs={12} md={7}>
              {auctionItem.images && auctionItem.images.length > 0 ? (
                auctionItem.images.length > 1 ? (
                  <ImageSlider images={auctionItem.images} />
                ) : (
                  <CardMedia
                    component="img"
                    image={auctionItem.images[0].image}
                    alt={auctionItem.title}
                    sx={{ width: "100%", height: "auto", objectFit: "cover" }}
                  />
                )
              ) : auctionItem.image ? (
                <CardMedia
                  component="img"
                  image={auctionItem.image}
                  alt={auctionItem.title}
                  sx={{ width: "100%", height: "auto", objectFit: "cover" }}
                />
              ) : (
                <Typography variant="body2">{t('auction.noImageAvailable')}</Typography>
              )}
            </Grid>

            {/* Right: Details */}
            <Grid item xs={12} md={5}>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {auctionItem.title}
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}
              >
                {auctionItem.buy_now_price
                  ? `${t('auction.price')}: $${auctionItem.buy_now_price}`
                  : auctionItem.current_bid
                  ? `${t('auction.currentBid')}: $${auctionItem.current_bid}`
                  : `${t('auction.startingBid')}: $${auctionItem.starting_bid}`}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {t('auction.category')}: {auctionItem.category_data?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {t('auction.condition')}: {auctionItem.condition}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {t('auction.location')}: {auctionItem.location}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {t('auction.seller')}: {auctionItem.owner?.username}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {t('auction.timeRemaining')}: <CountdownTimer endTime={auctionItem.end_time} />
              </Typography>

              {/* Bid & Buy Buttons */}
              {canBid && (
                <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <TextField
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    label={`${t('auction.min')}: $${minRequiredBid}`}
                    size="small"
                    sx={{ width: 140 }}
                  />
                  <Button variant="contained" color="success" onClick={handlePlaceBid}>
                    {t('auction.bid')}
                  </Button>
                </Box>
              )}
              {canBuyNow && (
                <Button variant="contained" color="secondary" onClick={handleBuyNow} sx={{ mt: 2 }}>
                  {t('auction.buyNowFor')} ${auctionItem.buy_now_price}
                </Button>
              )}
              {user?.username === auctionItem.owner?.username && (
                <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                  <Button variant="outlined" onClick={handleDelete}>
                    {t('auction.delete')}
                  </Button>
                  <Button variant="outlined" component={Link} to={`/update/${auctionItem.id}`}>
                    {t('auction.update')}
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* Description Section */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, borderColor: "#ddd" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              {t('auction.description')}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {auctionItem.description || t("auction.noDescription")}
            </Typography>
          </Paper>

          {/* Bid History Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              {t('auction.bidHistory')}
            </Typography>
            {auctionItem.bids && auctionItem.bids.length ? (
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {auctionItem.bids.map((bid) => (
                  <Box key={bid.id} component="li" sx={{ py: 1, borderBottom: "1px solid #eee" }}>
                    <strong>{bid.bidder?.username}</strong> {t('auction.bid').toLowerCase()} ${bid.amount} on{" "}
                    {moment(bid.timestamp).format("MMMM Do YYYY, h:mm:ss a")}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2">{t('auction.noBidsYet')}</Typography>
            )}
          </Box>

          {/* Similar Products Section */}
          {similarAuctions && similarAuctions.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                {t('auction.similarProducts')}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  gap: 2,
                  p: 1,
                }}
              >
                {similarAuctions.map((sim) => (
                  <Card
                    key={sim.id}
                    variant="outlined"
                    sx={{
                      minWidth: 220,
                      flex: "0 0 auto",
                      cursor: "pointer",
                      transition: "box-shadow 0.3s",
                      "&:hover": { boxShadow: 6 },
                    }}
                    onClick={() => navigate(`/auction/${sim.id}`)}
                  >
                    {sim.images && sim.images.length > 0 ? (
                      <CardMedia
                        component="img"
                        image={sim.images[0].image}
                        alt={sim.title}
                        sx={{ height: 140, objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 140,
                          backgroundColor: "#ddd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography variant="caption">{t('auction.noImage')}</Typography>
                      </Box>
                    )}
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        {sim.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ${sim.buy_now_price || sim.current_bid || sim.starting_bid}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

export default ProductDetails;
