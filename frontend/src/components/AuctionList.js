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
  Menu as MuiMenu,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { toast } from "react-toastify";

import { getAllAuctionItems, placeBid, buyNow } from "../services/auctionService";
import { getAllCategories } from "../services/categoryService";
import { UserContext } from "../contexts/UserContext";

import CountdownTimer from "./CountdownTimer";
import BuyNowModal from "./BuyNowModal";
import FavoriteButton from "./FavoriteButton";

const AuctionList = () => {
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
      const params = { ...appliedFilters, sort_by: sortBy };
      if (query) params.q = query;
      return getAllAuctionItems(params);
    },
    onError: () => toast.error("Failed to load auction items."),
    refetchInterval: 5000, // Refresh data every 5 seconds
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

  // ----- Loading/Error states -----
  if (isLoading) {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }
  if (isError) {
    return <Typography sx={{ p: 2 }}>Failed to load auction items.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      {/* Top Bar (Filters + Sort) */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={handleFilterClick}
            sx={{
              backgroundColor: "primary.main",
              color: "#fff",
              "&:hover": { backgroundColor: "primary.dark" },
            }}
          >
            <FilterListIcon />
          </IconButton>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            Filters
          </Typography>
        </Box>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} onChange={handleSortChange} label="Sort By">
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="ending_soon">Ending Soon</MenuItem>
            <MenuItem value="highest_bid">Highest Bid</MenuItem>
            <MenuItem value="lowest_price">Lowest Price</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Auction Items Grid */}
      {Array.isArray(auctionItems) && auctionItems.length > 0 ? (
        <Box>
          {auctionItems.map((item) => {
            const isNotOwner =
              user && item.owner && user.username !== item.owner.username;
            const canBid =
              isNotOwner && item.status === "active" && !item.buy_now_buyer;
            const canBuyNow =
              isNotOwner &&
              item.status === "active" &&
              item.buy_now_price &&
              !item.buy_now_buyer;

            // Minimum bid logic
            const minBid = item.current_bid
              ? parseFloat(item.current_bid)
              : parseFloat(item.starting_bid);
            const minIncrement = minBid * 0.02;
            const minRequiredBid = (minBid + minIncrement).toFixed(2);

            return (
              <Box
                key={item.id}
                onClick={() => navigate(`/auction/${item.id}`)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  mb: 2,
                  p: 2,
                  cursor: "pointer",
                  "&:hover": {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  },
                }}
              >
                {/* Left: Square Image */}
                <Box
                  sx={{
                    width: 150,
                    height: 150,
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0].image}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f4f4f4",
                        borderRadius: "6px",
                      }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        No image
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Middle: Auction Details */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  {item.category_data?.name && (
                    <Typography variant="body2" color="textSecondary">
                      {item.category_data.name}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Current Bid:</strong>{" "}
                    {item.current_bid ? `$${item.current_bid}` : "No bids yet"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Time Left:</strong>{" "}
                    <CountdownTimer endTime={item.end_time} />
                  </Typography>
                  {item.location && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>City:</strong> {item.location}
                    </Typography>
                  )}
                  {item.condition && (
                    <Typography variant="body2">
                      <strong>Condition:</strong> {item.condition}
                    </Typography>
                  )}
                </Box>

                {/* Right: Actions */}
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  {item.buy_now_price && (
                    <Typography
                      variant="body1"
                      sx={{
                        color: "black",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}
                    >
                      Buy Now: ${item.buy_now_price}
                    </Typography>
                  )}
                  <FavoriteButton auctionItemId={item.id} />
                  {canBid && (
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                      <TextField
                        label={`Min: $${minRequiredBid}`}
                        placeholder={`$${minRequiredBid}`}
                        type="number"
                        value={bidAmounts[item.id] || ""}
                        onChange={(e) =>
                          setBidAmounts({ ...bidAmounts, [item.id]: e.target.value })
                        }
                        variant="outlined"
                        size="small"
                        sx={{ width: 130 }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handlePlaceBid(item.id, minRequiredBid)}
                        sx={{
                          backgroundColor: "#2e7d32",
                          color: "#fff",
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                          textTransform: "none",
                          padding: "6px 12px",
                          "&:hover": {
                            backgroundColor: "#1b5e20",
                          },
                        }}
                      >
                        BID
                      </Button>
                    </Box>
                  )}
                  {canBuyNow && (
                    <Button
                      variant="contained"
                      onClick={() => openBuyNowModal(item)}
                      sx={{
                        mt: canBid ? 0 : 1,
                        backgroundColor: "#000",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        padding: "8px 16px",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "#333",
                        },
                      }}
                    >
                      BUY NOW
                    </Button>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography sx={{ mt: 2 }}>
          {query ? "No auction items found for your search." : "No auction items available."}
        </Typography>
      )}

      {/* Buy Now Modal */}
      {selectedItem && (
        <BuyNowModal
          open={modalOpen}
          handleClose={closeBuyNowModal}
          handleConfirm={handleConfirmBuyNow}
          buyNowPrice={selectedItem.buy_now_price}
        />
      )}

      {/* Filter Menu */}
      <MuiMenu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <Box sx={{ p: 2, width: 250 }}>
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
            {cities.map((cityObj) => (
              <MenuItem key={cityObj.city} value={cityObj.city}>
                {cityObj.city}
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
            sx={{ mt: 1 }}
          >
            Apply Filters
          </Button>
        </Box>
      </MuiMenu>
    </Box>
  );
};

export default AuctionList;
