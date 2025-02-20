import React, { useContext, useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { toast } from "react-toastify";

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
// Countdown Timer
// ----------------------
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

// ----------------------
// Image Slider
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
// ProductDetails
// ----------------------
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();

  const [bidAmount, setBidAmount] = useState("");

  // 1) Fetch main auction item
  const {
    data: auctionItem,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["auctionItem", id],
    queryFn: () => getAuctionItem(id),
    onError: () => toast.error("Failed to load auction item."),
  });

  // 2) Fetch similar auctions
  const { data: similarAuctions } = useQuery({
    queryKey: ["similarAuctions", auctionItem?.category_data?.name],
    queryFn: () =>
      getSimilarAuctions(auctionItem?.category_data?.name, auctionItem.id),
    enabled: !!auctionItem,
  });

  // ----- Mutations -----
  const bidMutation = useMutation({
    mutationFn: placeBid,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItem", id]);
      toast.success("Bid placed successfully!");
      setBidAmount("");
    },
    onError: (error) => {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to place bid. Please try again.");
      }
    },
  });

  const buyNowMutation = useMutation({
    mutationFn: buyNow,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItem", id]);
      toast.success("Purchase successful!");
      navigate("/");
    },
    onError: (error) => {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to complete purchase. Please try again.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuctionItem,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success("Auction item deleted successfully.");
      navigate("/");
    },
    onError: () => {
      toast.error("Failed to delete auction item.");
    },
  });

  // ----- Loading states -----
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

  // ----- Permissions -----
  const canBid =
    user &&
    auctionItem.owner &&
    user.username !== auctionItem.owner.username &&
    auctionItem.status === "active" &&
    !auctionItem.buy_now_buyer;

  const canBuyNow =
    user &&
    auctionItem.owner &&
    user.username !== auctionItem.owner.username &&
    auctionItem.status === "active" &&
    auctionItem.buy_now_price &&
    !auctionItem.buy_now_buyer;

  // ----- Minimum Bid Logic -----
  const minBid = auctionItem.current_bid
    ? parseFloat(auctionItem.current_bid)
    : parseFloat(auctionItem.starting_bid);
  const minIncrement = minBid * 0.02;
  const minRequiredBid = (minBid + minIncrement).toFixed(2);

  // ----- Handlers -----
  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      toast.error("Please enter a valid bid amount.");
      return;
    }
    if (amount < minRequiredBid) {
      toast.error(`Bid must be at least $${minRequiredBid}.`);
      return;
    }
    bidMutation.mutate({ id: auctionItem.id, amount });
  };

  const handleBuyNow = () => {
    if (window.confirm("Are you sure you want to buy this item now?")) {
      buyNowMutation.mutate(auctionItem.id);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this auction item?")) {
      deleteMutation.mutate(auctionItem.id);
    }
  };

  // ----- Layout (OLX‐like) -----
  return (
    <Box sx={{ p: 3, backgroundColor: "#f7f7f7", minHeight: "100vh" }}>
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
          {/* --------- TOP ROW: Images on the left, Key Info on the right ---------- */}
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
                <Typography variant="body2">No image available.</Typography>
              )}
            </Grid>

            {/* Right: Title, Price, Condition, Location, Bid/Buy */}
            <Grid item xs={12} md={5}>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {auctionItem.title}
              </Typography>

              {/* Price or currentBid fallback */}
              <Typography
                variant="h5"
                sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}
              >
                {auctionItem.buy_now_price
                  ? `Price: $${auctionItem.buy_now_price}`
                  : auctionItem.current_bid
                  ? `Current Bid: $${auctionItem.current_bid}`
                  : `Starting Bid: $${auctionItem.starting_bid}`}
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Category: {auctionItem.category_data?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Condition: {auctionItem.condition}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Location: {auctionItem.location}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Seller: {auctionItem.owner?.username}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Time Remaining: <CountdownTimer endTime={auctionItem.end_time} />
              </Typography>

              {/* Bid & Buy Buttons */}
              {canBid && (
                <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <TextField
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    label={`Min: $${minRequiredBid}`}
                    size="small"
                    sx={{ width: 140 }}
                  />
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handlePlaceBid}
                  >
                    Bid
                  </Button>
                </Box>
              )}

              {canBuyNow && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleBuyNow}
                  sx={{ mt: 2 }}
                >
                  Buy Now for ${auctionItem.buy_now_price}
                </Button>
              )}

              {/* If user is the owner, show Delete/Update */}
              {user?.username === auctionItem.owner?.username && (
                <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                  <Button variant="outlined" onClick={handleDelete}>
                    Delete
                  </Button>
                  <Button variant="outlined" component={Link} to={`/update/${auctionItem.id}`}>
                    Update
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* --------- DESCRIPTION Section ---------- */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              borderColor: "#ddd",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {auctionItem.description || "No description provided."}
            </Typography>
          </Paper>

          {/* --------- BID HISTORY Section ---------- */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Bid History
            </Typography>
            {auctionItem.bids && auctionItem.bids.length ? (
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {auctionItem.bids.map((bid) => (
                  <Box
                    key={bid.id}
                    component="li"
                    sx={{ py: 1, borderBottom: "1px solid #eee" }}
                  >
                    <strong>{bid.bidder?.username}</strong> bid ${bid.amount} on{" "}
                    {moment(bid.timestamp).format("MMMM Do YYYY, h:mm:ss a")}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2">No bids yet.</Typography>
            )}
          </Box>

          {/* --------- SIMILAR PRODUCTS Section ---------- */}
          {similarAuctions && similarAuctions.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Similar Products
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
                        <Typography variant="caption">No image</Typography>
                      </Box>
                    )}
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        {sim.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        $
                        {sim.buy_now_price ||
                          sim.current_bid ||
                          sim.starting_bid}
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
