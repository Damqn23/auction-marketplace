import React, { useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllAuctionItems,
  placeBid,
  buyNow,
} from "../services/auctionService";
import { getAllCategories } from "../services/categoryService";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  TextField,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Box,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import styles from "./AuctionList.module.css";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import BuyNowModal from "./BuyNowModal";
import FavoriteButton from "./FavoriteButton";

// ---------------------
// CountdownTimer Component
// ---------------------
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
    return <span>Auction ended</span>;
  }

  return (
    <span>
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </span>
  );
};

// ---------------------
// AuctionList Component
// ---------------------
const AuctionList = () => {
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();
  const [bidAmounts, setBidAmounts] = useState({});
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const navigate = useNavigate();

  // Get search query and category from URL parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("q") || "";
  const categoryFromUrl = queryParams.get("category") || "";

  // Initialize filter states
  const initialFilterValues = {
    min_price: "",
    max_price: "",
    condition: "",
    location: "",
    category: categoryFromUrl,
  };
  const [pendingFilters, setPendingFilters] = useState(initialFilterValues);
  const [appliedFilters, setAppliedFilters] = useState(initialFilterValues);

  // Fetch categories for the filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
  });

  // Fetch auction items using applied filters
  const { data: auctionItems, isLoading, isError } = useQuery({
    queryKey: ["auctionItems", query, appliedFilters, sortBy],
    queryFn: () => {
      const params = { ...appliedFilters, sort_by: sortBy };
      if (query) {
        params.q = query;
      }
      return getAllAuctionItems(params);
    },
    onError: () => {
      toast.error("Failed to load auction items.");
    },
  });

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (e) => {
    setPendingFilters({
      ...pendingFilters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    handleFilterClose();
    queryClient.invalidateQueries(["auctionItems"]);
  };

  // Place Bid Mutation
  const bidMutation = useMutation({
    mutationFn: placeBid,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success("Bid placed successfully!");
    },
    onError: (error) => {
      if (error.response && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to place bid. Please try again.");
      }
    },
  });

  // Buy Now Mutation
  const buyNowMutation = useMutation({
    mutationFn: buyNow,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success("Purchase successful!");
    },
    onError: (error) => {
      if (error.response && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to complete purchase. Please try again.");
      }
    },
  });

  const handlePlaceBid = (id) => {
    const amount = parseFloat(bidAmounts[id]);
    if (isNaN(amount)) {
      toast.error("Please enter a valid bid amount.");
      return;
    }
    bidMutation.mutate({ id, amount });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openBuyNowModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeBuyNowModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };

  const handleConfirmBuyNow = () => {
    if (!selectedItem) return;
    buyNowMutation.mutate(selectedItem.id);
    closeBuyNowModal();
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load auction items.</p>;

  return (
    <div className={styles.container}>
      {/* New Header: Only Filter and Sort Controls with a stylish background */}
      <div className={styles.header}>
        <div className={styles.headerControls}>
          <IconButton
            className={styles.filterButton}
            onClick={handleFilterClick}
          >
            <FilterListIcon />
            <Typography variant="body1" className={styles.filterText}>
              Filters
            </Typography>
          </IconButton>
          <FormControl
            variant="outlined"
            size="small"
            className={styles.sortControl}
          >
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={handleSortChange}
              label="Sort By"
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="ending_soon">Ending Soon</MenuItem>
              <MenuItem value="highest_bid">Highest Bid</MenuItem>
              <MenuItem value="lowest_price">Lowest Price</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Auction Items Grid */}
      {Array.isArray(auctionItems) && auctionItems.length > 0 ? (
        <Grid container spacing={2}>
          {auctionItems.map((item) => {
            const isNotOwner =
              user && item.owner && user.username !== item.owner.username;
            const canBid =
              isNotOwner &&
              item.status === "active" &&
              !item.buy_now_buyer;
            const canBuyNow =
              isNotOwner &&
              item.status === "active" &&
              item.buy_now_price &&
              !item.buy_now_buyer;
            const minBidValue = item.current_bid
              ? parseFloat(item.current_bid)
              : parseFloat(item.starting_bid);
            const minIncrement = minBidValue * 0.02;
            const minRequiredBid = (minBidValue + minIncrement).toFixed(2);

            return (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card
                  className={styles.auctionCard}
                  onClick={() => navigate(`/auction/${item.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {item.images && item.images.length > 0 ? (
                    <CardMedia
                      component="img"
                      height="250"
                      image={item.images[0].image}
                      alt={item.title}
                    />
                  ) : (
                    <div className={styles.noImageFallback}>
                      <Typography variant="body2" color="textSecondary">
                        No image available
                      </Typography>
                    </div>
                  )}
                  <CardContent style={{ marginTop: "10px" }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {item.title}
                    </Typography>
                    {item.category_data && (
                      <Typography variant="body2" color="textSecondary">
                        <strong>Category:</strong> {item.category_data.name}
                      </Typography>
                    )}
                    <Typography variant="body1">
                      <strong>Starting Bid:</strong> ${item.starting_bid}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Current Bid:</strong>{" "}
                      {item.current_bid
                        ? `$${item.current_bid}`
                        : "No bids yet"}
                    </Typography>
                    {item.buy_now_price && (
                      <Typography variant="body1" color="secondary">
                        <strong>Buy Now Price:</strong> ${item.buy_now_price}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Time Remaining:</strong>{" "}
                      <CountdownTimer endTime={item.end_time} />
                    </Typography>
                    {item.owner && item.owner.username && (
                      <Typography variant="body2">
                        <strong>Owner:</strong> {item.owner.username}
                      </Typography>
                    )}
                    {item.buy_now_buyer && (
                      <Typography
                        variant="body2"
                        color="primary"
                        sx={{ mt: 1 }}
                      >
                        Purchased via Buy Now by:{" "}
                        {item.buy_now_buyer.username}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions
                    onClick={(e) => e.stopPropagation()}
                    className={styles.cardActions}
                  >
                    <FavoriteButton auctionItemId={item.id} />
                    {isNotOwner && (
                      <Box
                        sx={{
                          marginLeft: "auto",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {canBid && (
                          <div className={styles.bidSection}>
                            <TextField
                              label={`Min: $${minRequiredBid}`}
                              type="number"
                              value={bidAmounts[item.id] || ""}
                              onChange={(e) =>
                                setBidAmounts({
                                  ...bidAmounts,
                                  [item.id]: e.target.value,
                                })
                              }
                              inputProps={{
                                min: minRequiredBid,
                                step: "0.01",
                              }}
                              variant="outlined"
                              size="small"
                              className={styles.bidInput}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              variant="contained"
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaceBid(item.id);
                              }}
                              className={styles.bidButton}
                            >
                              Bid
                            </Button>
                          </div>
                        )}
                        {canBuyNow && (
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBuyNowModal(item);
                            }}
                            className={styles.buyNowButton}
                          >
                            Buy Now
                          </Button>
                        )}
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography variant="body1" sx={{ mt: 2 }}>
          {query
            ? "No auction items found for your search."
            : "No auction items available."}
        </Typography>
      )}

      {selectedItem && (
        <BuyNowModal
          open={modalOpen}
          handleClose={closeBuyNowModal}
          handleConfirm={handleConfirmBuyNow}
          buyNowPrice={selectedItem.buy_now_price}
        />
      )}

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <Box padding={2}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <TextField
            label="Min Price"
            name="min_price"
            value={pendingFilters.min_price}
            onChange={handleFilterChange}
            fullWidth
            margin="dense"
            type="number"
          />
          <TextField
            label="Max Price"
            name="max_price"
            value={pendingFilters.max_price}
            onChange={handleFilterChange}
            fullWidth
            margin="dense"
            type="number"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Condition</InputLabel>
            <Select
              name="condition"
              value={pendingFilters.condition}
              onChange={handleFilterChange}
              label="Condition"
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Used">Used</MenuItem>
              <MenuItem value="Refurbished">Refurbished</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Location"
            name="location"
            value={pendingFilters.location}
            onChange={handleFilterChange}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={pendingFilters.category}
              onChange={handleFilterChange}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categoriesData &&
                categoriesData.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={applyFilters}
            style={{ marginTop: "10px" }}
          >
            Apply Filters
          </Button>
        </Box>
      </Menu>
    </div>
  );
};

export default AuctionList;
