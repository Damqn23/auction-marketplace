import React, { useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  TextField,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Skeleton,
  Fade,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { keyframes } from "@emotion/react";

import { getAllAuctionItems, placeBid, buyNow, searchAuctionItems } from "../services/auctionService";
import { getAllCategories } from "../services/categoryService";
import { UserContext } from "../contexts/UserContext";

import CountdownTimer from "./CountdownTimer";
import BuyNowModal from "./BuyNowModal";
import FavoriteButton from "./FavoriteButton";

// Add animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const AuctionList = () => {
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ----- URL search params and filters -----
  const locationHook = useLocation();
  const queryParams = new URLSearchParams(locationHook.search);
  const query = queryParams.get("q") || "";
  const categoryFromUrl = queryParams.get("category") || "";

  const initialFilterValues = {
    min_price: "",
    max_price: "",
    condition: "",
    location: "",
    category: categoryFromUrl,
  };
  const [pendingFilters, setPendingFilters] = useState(initialFilterValues);
  const [appliedFilters, setAppliedFilters] = useState(initialFilterValues);

  // ----- Sort & Filter UI state -----
  const [sortBy, setSortBy] = useState("newest");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // ----- Data fetching -----
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
  });

  const { data: auctionItems, isLoading, isError } = useQuery({
    queryKey: ["auctionItems", query, appliedFilters, sortBy],
    queryFn: () => {
      // If user typed something, do fuzzy search:
      if (query) {
        return searchAuctionItems(query, appliedFilters.category);
      } else {
        // No query? Then just do the normal listing
        const params = { ...appliedFilters, sort_by: sortBy };
        return getAllAuctionItems(params);
      }
    },
    refetchInterval: 5000,
    onError: () => toast.error("Failed to load auction items."),
  });

  // ----- Bulgarian cities (for Location filter) -----
  const [cities, setCities] = useState([]);
  useEffect(() => {
    fetch("/data/bg.json")
      .then((res) => res.json())
      .then((data) => {
        const sortedCities = data.sort((a, b) => a.city.localeCompare(b.city));
        setCities(sortedCities);
      })
      .catch((error) => console.error("Error fetching cities:", error));
  }, []);

  // ----- Bidding & Buy Now mutations -----
  const [bidAmounts, setBidAmounts] = useState({});

  const bidMutation = useMutation({
    mutationFn: placeBid,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success("Bid placed successfully!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to place bid.");
    },
  });

  const handlePlaceBid = (auctionId) => {
    const amount = parseFloat(bidAmounts[auctionId]);
    if (isNaN(amount)) {
      toast.error("Please enter a valid bid amount.");
      return;
    }
    bidMutation.mutate({ id: auctionId, amount });
  };

  const buyNowMutation = useMutation({
    mutationFn: buyNow,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success("Purchase successful!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to complete purchase.");
    },
  });

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

  // ----- Filter Handlers -----
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget);
  const handleFilterClose = () => setFilterAnchorEl(null);
  const handleFilterChange = (e) => {
    setPendingFilters({ ...pendingFilters, [e.target.name]: e.target.value });
  };
  const handleSortChange = (e) => setSortBy(e.target.value);
  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    handleFilterClose();
    queryClient.invalidateQueries(["auctionItems"]);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Grid container spacing={2}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Card sx={{ height: '100%', animation: `${fadeIn} 0.5s ease-out` }}>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" height={32} />
              <Skeleton variant="text" width="60%" />
              <Box sx={{ mt: 1 }}>
                <Skeleton variant="text" width="40%" />
              </Box>
            </CardContent>
            <CardActions>
              <Skeleton variant="rectangular" width={100} height={36} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Empty state component
  const EmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center',
      }}
    >
      <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        No auctions found
      </Typography>
      <Typography color="text.secondary" paragraph>
        Try adjusting your filters or search terms
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          setAppliedFilters(initialFilterValues);
          setSortBy('newest');
        }}
      >
        Reset Filters
      </Button>
    </Box>
  );

  // Loading/Error states with new UI
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  if (isError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Failed to load auction items
        </Typography>
        <Button
          variant="contained"
          onClick={() => queryClient.invalidateQueries(["auctionItems"])}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        mt: { xs: '64px', sm: '72px' },
        pt: { xs: 2, sm: 3 },
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #f7f9fc 100%)',
      }}
    >
      {/* Top Bar (Filters + Sort) */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: "space-between",
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Filters">
            <IconButton
              onClick={handleFilterClick}
              sx={{
                backgroundColor: "primary.main",
                color: "#fff",
                "&:hover": { 
                  backgroundColor: "primary.dark",
                  transform: "scale(1.05)",
                },
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {query ? `Search results for "${query}"` : "All Auctions"}
          </Typography>
        </Box>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            label="Sort By"
            startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="ending_soon">Ending Soon</MenuItem>
            <MenuItem value="highest_bid">Highest Bid</MenuItem>
            <MenuItem value="lowest_price">Lowest Price</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Auction Items Grid */}
      {Array.isArray(auctionItems) && auctionItems.length > 0 ? (
        <Grid container spacing={2}>
          {auctionItems.map((item, index) => {
            const isNotOwner = user && item.owner && user.username !== item.owner.username;
            const canBid = isNotOwner && item.status === "active" && !item.buy_now_buyer;
            const canBuyNow = isNotOwner && item.status === "active" && item.buy_now_price && !item.buy_now_buyer;
            const minBid = item.current_bid ? parseFloat(item.current_bid) : parseFloat(item.starting_bid);
            const minIncrement = minBid * 0.02;
            const minRequiredBid = (minBid + minIncrement).toFixed(2);

            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Fade in timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.images?.[0]?.image || '/placeholder.jpg'}
                      alt={item.title}
                      sx={{
                        objectFit: 'cover',
                        cursor: 'pointer',
                        '&:hover': {
                          animation: `${pulse} 1s ease-in-out`,
                        },
                      }}
                      onClick={() => navigate(`/auction/${item.id}`)}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h2" noWrap>
                          {item.title}
                        </Typography>
                        <FavoriteButton auctionId={item.id} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.description?.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ p: 2, pt: 1 }}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Current Bid
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ${item.current_bid || item.starting_bid}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {canBid && (
                            <TextField
                              size="small"
                              type="number"
                              placeholder={`Min: $${minRequiredBid}`}
                              value={bidAmounts[item.id] || ''}
                              onChange={(e) => setBidAmounts({ ...bidAmounts, [item.id]: e.target.value })}
                              sx={{ flex: 1 }}
                            />
                          )}
                          {canBid && (
                            <Button
                              variant="contained"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaceBid(item.id);
                              }}
                              disabled={bidMutation.isLoading}
                            >
                              Bid
                            </Button>
                          )}
                          {canBuyNow && (
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openBuyNowModal(item);
                              }}
                            >
                              Buy Now
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <EmptyState />
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 300,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={pendingFilters.category}
                  onChange={handleFilterChange}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categoriesData?.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Min Price"
                name="min_price"
                type="number"
                value={pendingFilters.min_price}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Max Price"
                name="max_price"
                type="number"
                value={pendingFilters.max_price}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Condition</InputLabel>
                <Select
                  name="condition"
                  value={pendingFilters.condition}
                  onChange={handleFilterChange}
                  label="Condition"
                >
                  <MenuItem value="">All Conditions</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="like_new">Like New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  name="location"
                  value={pendingFilters.location}
                  onChange={handleFilterChange}
                  label="Location"
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city.id} value={city.city}>
                      {city.city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setPendingFilters(initialFilterValues);
              handleFilterClose();
            }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            onClick={applyFilters}
            fullWidth
          >
            Apply Filters
          </Button>
        </Box>
      </Menu>

      {/* Buy Now Modal */}
      <BuyNowModal
        open={modalOpen}
        onClose={closeBuyNowModal}
        onConfirm={handleConfirmBuyNow}
        item={selectedItem}
      />
    </Box>
  );
};

export default AuctionList;
