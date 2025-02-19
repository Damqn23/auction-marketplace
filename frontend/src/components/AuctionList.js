import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllAuctionItems,
  placeBid,
  buyNow,
} from "../services/auctionService";
import { getAllCategories } from "../services/categoryService";
import { useLocation, useNavigate } from "react-router-dom";
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
import { keyframes } from "@emotion/react";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import BuyNowModal from "./BuyNowModal";
import FavoriteButton from "./FavoriteButton";

// ----- Keyframe Animations -----
const borderShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulseBackground = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

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
    return <Typography component="span">Auction ended</Typography>;
  }

  return (
    <Typography component="span">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </Typography>
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
  const locationHook = useLocation();
  const queryParams = new URLSearchParams(locationHook.search);
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

  // New state for Bulgarian cities
  const [cities, setCities] = useState([]);

  // Fetch Bulgarian cities from the local bg.json file
  useEffect(() => {
    fetch("/data/bg.json")
      .then((res) => res.json())
      .then((data) => {
        // Sort the data alphabetically by the "city" field
        const sortedCities = data.sort((a, b) =>
          a.city.localeCompare(b.city)
        );
        setCities(sortedCities);
      })
      .catch((error) => console.error("Error fetching cities:", error));
  }, []);

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

  if (isLoading)
    return (
      <Typography variant="body1" sx={{ p: 2 }}>
        Loading...
      </Typography>
    );
  if (isError)
    return (
      <Typography variant="body1" sx={{ p: 2 }}>
        Failed to load auction items.
      </Typography>
    );

  return (
    <Box
      sx={{
        position: "relative",
        p: "20px",
        width: "100%",
        m: 0,
        background: "linear-gradient(135deg, #a6c0fe, #f68084)",
        overflow: "hidden",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      {/* Header with Filter & Sort Controls */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.95)",
          py: "12px",
          px: "24px",
          borderBottom: "1px solid #ddd",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "20px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <IconButton
            onClick={handleFilterClick}
            sx={{
              backgroundColor: "#ff8a80",
              color: "#ffffff",
              borderRadius: "8px",
              py: "8px",
              px: "16px",
              display: "flex",
              alignItems: "center",
              transition: "background-color 0.3s ease, transform 0.2s ease",
              "&:hover": {
                backgroundColor: "#ff5252",
                transform: "scale(1.05)",
              },
            }}
          >
            <FilterListIcon />
            <Typography variant="body1" sx={{ ml: 1 }}>
              Filters
            </Typography>
          </IconButton>
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#e0f7fa",
              borderRadius: "8px",
              p: "4px 8px",
              "& .MuiInputBase-root, & .MuiInputLabel-root": {
                color: "#333",
              },
            }}
          >
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={handleSortChange} label="Sort By">
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="ending_soon">Ending Soon</MenuItem>
              <MenuItem value="highest_bid">Highest Bid</MenuItem>
              <MenuItem value="lowest_price">Lowest Price</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Auction Items Grid */}
      {Array.isArray(auctionItems) && auctionItems.length > 0 ? (
        <Grid container spacing={2}>
          {auctionItems.map((item) => {
            const isNotOwner =
              user &&
              item.owner &&
              user.username !== item.owner.username;
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
                  onClick={() => navigate(`/auction/${item.id}`)}
                  sx={{
                    borderRadius: "16px",
                    position: "relative",
                    background: "#ffffff",
                    overflow: "hidden",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    zIndex: 0,
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 20px rgba(0, 0, 0, 0.15)",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "-2px",
                      left: "-2px",
                      right: "-2px",
                      bottom: "-2px",
                      background:
                        "linear-gradient(45deg, #ff8a80, #81d4fa, #4fc3f7, #ff5252)",
                      backgroundSize: "400% 400%",
                      zIndex: -1,
                      filter: "blur(8px)",
                      animation: `${borderShift} 10s ease infinite`,
                      borderRadius: "18px",
                      opacity: 0.8,
                    },
                  }}
                >
                  {item.images && item.images.length > 0 ? (
                    <CardMedia
                      component="img"
                      height="250"
                      image={item.images[0].image}
                      alt={item.title}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: "250px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
                        animation: `${pulseBackground} 4s ease-in-out infinite`,
                      }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        No image available
                      </Typography>
                    </Box>
                  )}
                  <CardContent sx={{ mt: 1 }}>
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
                      {item.current_bid ? `$${item.current_bid}` : "No bids yet"}
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
                      <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                        Purchased via Buy Now by: {item.buy_now_buyer.username}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: { xs: "flex-start", md: "center" },
                      justifyContent: "space-between",
                      p: "16px",
                    }}
                  >
                    <FavoriteButton auctionItemId={item.id} />
                    {isNotOwner && (
                      <Box
                        sx={{
                          ml: "auto",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {canBid && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
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
                              sx={{ width: "100px" }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              variant="contained"
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaceBid(item.id);
                              }}
                              sx={{
                                textTransform: "none",
                                transition: "background-color 0.3s ease",
                                "&:hover": {
                                  backgroundColor: "#66bb6a",
                                },
                              }}
                            >
                              Bid
                            </Button>
                          </Box>
                        )}
                        {canBuyNow && (
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBuyNowModal(item);
                            }}
                            sx={{
                              backgroundColor: "#ff5722",
                              color: "#ffffff",
                              textTransform: "none",
                              ml: { xs: 0, md: "16px" },
                              mt: { xs: "10px", md: 0 },
                              transition:
                                "background-color 0.3s ease, transform 0.3s ease",
                              "&:hover": {
                                backgroundColor: "#e64a19",
                                transform: "scale(1.05)",
                              },
                              width: { xs: "100%", md: "auto" },
                            }}
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

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <Box sx={{ p: 2 }}>
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
          {/* Use a dropdown for Location with the fetched cities */}
          <TextField
            select
            label="Location"
            name="location"
            value={pendingFilters.location}
            onChange={handleFilterChange}
            fullWidth
            margin="dense"
          >
            <MenuItem value="">
              <em>Select City</em>
            </MenuItem>
            {cities.map((city) => (
              <MenuItem key={city.city} value={city.city}>
                {city.city}
              </MenuItem>
            ))}
          </TextField>
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
            sx={{ mt: "10px" }}
          >
            Apply Filters
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default AuctionList;
