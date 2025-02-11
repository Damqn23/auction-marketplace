// frontend/src/components/AuctionList.js

import React, { useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllAuctionItems,
  deleteAuctionItem,
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
  Tooltip,
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
import moment from "moment";
import BuyNowModal from "./BuyNowModal";

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

  // Initialize filter states (using separate states for pending and applied filters)
  const initialFilterValues = {
    min_price: "",
    max_price: "",
    condition: "",
    location: "",
    category: categoryFromUrl,
  };
  const [pendingFilters, setPendingFilters] = useState(initialFilterValues);
  const [appliedFilters, setAppliedFilters] = useState(initialFilterValues);

  console.log("Search query:", query);

  // Fetch categories for the filter dropdown in the filter menu
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
  });

  // Fetch auction items using applied filters (only updated when Apply is clicked)
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

  console.log("Fetched auction items:", auctionItems);

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Update pending filters on input change (so typing doesn't trigger a refetch)
  const handleFilterChange = (e) => {
    setPendingFilters({
      ...pendingFilters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // When "Apply Filters" is clicked, update the applied filters and close the menu
  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    handleFilterClose();
    queryClient.invalidateQueries(["auctionItems"]);
  };

  // Delete Auction Item Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAuctionItem,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success("Auction item deleted successfully.");
    },
    onError: () => {
      toast.error("Failed to delete auction item.");
    },
  });

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

  // Handlers
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this auction item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePlaceBid = (id) => {
    const amount = parseFloat(bidAmounts[id]);
    if (isNaN(amount)) {
      toast.error("Please enter a valid bid amount.");
      return;
    }
    bidMutation.mutate({ id, amount });
  };

  // Buy Now Modal state and handlers
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

  // Loading/Errors
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load auction items.</p>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Typography variant="h4" component="h2" gutterBottom>
          Auction Items
        </Typography>
        <Link to="/create" style={{ textDecoration: "none" }}>
          <Button variant="contained" color="primary">
            Create New Auction
          </Button>
        </Link>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <IconButton color="primary" onClick={handleFilterClick}>
          <FilterListIcon />
          <Typography variant="body1" style={{ marginLeft: "8px" }}>
            Filters
          </Typography>
        </IconButton>

        <FormControl variant="outlined" size="small" style={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} onChange={handleSortChange} label="Sort By">
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="ending_soon">Ending Soon</MenuItem>
            <MenuItem value="highest_bid">Highest Bid</MenuItem>
            <MenuItem value="lowest_price">Lowest Price</MenuItem>
          </Select>
        </FormControl>
      </div>

      {Array.isArray(auctionItems) && auctionItems.length > 0 ? (
        <Grid container spacing={2}>
          {auctionItems.map((item) => {
            // Determine if current user can place a bid
            const canBid =
              user &&
              item.owner &&
              user.username !== item.owner.username &&
              item.status === "active" &&
              !item.buy_now_buyer;

            // Determine if Buy Now is available
            const canBuyNow =
              user &&
              item.owner &&
              user.username !== item.owner.username &&
              item.status === "active" &&
              item.buy_now_price &&
              !item.buy_now_buyer;

            // Calculate the minimum required bid (2% increment)
            const minBid = item.current_bid
              ? parseFloat(item.current_bid)
              : parseFloat(item.starting_bid);
            const minIncrement = minBid * 0.02;
            const minRequiredBid = (minBid + minIncrement).toFixed(2);

            // Format end time
            const formattedEndTime = moment(item.end_time).format(
              "MMMM Do YYYY, h:mm:ss a"
            );

            return (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                {/* Make the entire card clickable */}
                <Card
                  className={styles.auctionCard}
                  onClick={() => navigate(`/auction/${item.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Card Image (or fallback text) */}
                  {item.images && item.images.length > 0 ? (
                    <CardMedia
                      component="img"
                      height="200"
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

                  <CardContent>
                    {/* Display some details */}
                    <Typography variant="h6" component="div" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {item.description}
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
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Status:</strong> {item.status}
                    </Typography>
                    <Typography variant="body2">
                      <strong>End Time:</strong> {formattedEndTime}
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

                  {/* Card Actions – stop click propagation so buttons work normally */}
                  <CardActions
                    onClick={(e) => e.stopPropagation()}
                    className={styles.cardActions}
                  >
                    {user && user.username === item.owner.username ? (
                      <>
                        {item.bids.length > 0 || item.buy_now_buyer ? (
                          <Tooltip title="Cannot delete items that have bids or have been purchased.">
                            <span>
                              <Button variant="outlined" color="secondary" disabled>
                                Delete
                              </Button>
                            </span>
                          </Tooltip>
                        ) : (
                          <>
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id);
                              }}
                            >
                              Delete
                            </Button>
                            <Link to={`/update/${item.id}`} style={{ textDecoration: "none" }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Update
                              </Button>
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      <>
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
                      </>
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

      {/* Buy Now Modal */}
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

          {/* Price Range */}
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

          {/* Condition */}
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

          {/* Location */}
          <TextField
            label="Location"
            name="location"
            value={pendingFilters.location}
            onChange={handleFilterChange}
            fullWidth
            margin="dense"
          />

          {/* Category */}
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

          {/* Apply Filters Button */}
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
