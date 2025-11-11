import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Grid,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";

import CountdownTimer from "./CountdownTimer"; // Same component used in AuctionList
import BuyNowModal from "./BuyNowModal"; // Same modal used in AuctionList
import { placeBid, buyNow } from "../services/auctionService";
import { UserContext } from "../contexts/UserContext";
import { useTranslation } from 'react-i18next';

/**
 * Helper: get image from item (similar to AuctionList logic).
 */
const getAuctionImage = (auctionItem) => {
  if (auctionItem.images && auctionItem.images.length > 0) {
    return auctionItem.images[0].image;
  }
  if (auctionItem.image) {
    return auctionItem.image;
  }
  return null;
};

const Favorites = () => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmounts, setBidAmounts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // Fetch favorites on mount
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/favorites/");
      setFavorites(response.data);
    } catch (error) {
      toast.error("Error fetching favorites.");
      console.error("Error fetching favorites", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Remove from favorites
  const handleRemove = async (favId, e) => {
    e.stopPropagation(); // prevent parent onClick from firing
    try {
      await axiosInstance.delete(`/favorites/${favId}/`);
      toast.success("Removed from favorites.");
      fetchFavorites();
    } catch (error) {
      toast.error("Error removing favorite.");
      console.error("Error removing favorite", error);
    }
  };

  // ----- Bidding & Buy Now logic (similar to AuctionList) -----

  const handlePlaceBid = async (itemId) => {
    const amount = parseFloat(bidAmounts[itemId]);
    if (isNaN(amount)) {
      toast.error("Please enter a valid bid amount.");
      return;
    }
    try {
      await placeBid({ id: itemId, amount });
      toast.success("Bid placed successfully!");
      // Clear input and refresh favorites
      setBidAmounts({ ...bidAmounts, [itemId]: "" });
      fetchFavorites();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to place bid.");
      console.error(error);
    }
  };

  const openBuyNowModal = (item, e) => {
    e.stopPropagation();
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeBuyNowModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };

  const handleConfirmBuyNow = async () => {
    if (!selectedItem) return;
    try {
      await buyNow(selectedItem.id);
      toast.success("Purchase successful!");
      closeBuyNowModal();
      fetchFavorites();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to complete purchase.");
      console.error(error);
    }
  };

  // ----- Render -----
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 1, sm: 2 },
        mt: { xs: '64px', sm: '72px' },
        pt: { xs: 2, sm: 3 },
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #f7f9fc 100%)',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: "bold",
          color: "primary.main",
          textShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        Favorite Items
      </Typography>

      {favorites.length === 0 ? (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography variant="body1">
            No favorites yet.
          </Typography>
        </Box>
      ) : (
        <Box>
          {favorites.map((fav) => {
            const item = fav.auction_item;
            const imageUrl = getAuctionImage(item);

            // If user is logged in, check ownership
            const isNotOwner = user && item.owner && user.username !== item.owner.username;
            const canBid = isNotOwner && item.status === "active" && !item.buy_now_buyer;
            const canBuyNow =
              isNotOwner && item.status === "active" && item.buy_now_price && !item.buy_now_buyer;

            // Minimum bid logic
            const minBid = item.current_bid
              ? parseFloat(item.current_bid)
              : parseFloat(item.starting_bid);
            const minIncrement = minBid * 0.02;
            const minRequiredBid = (minBid + minIncrement).toFixed(2);

            return (
              <Box
                key={fav.id}
                onClick={() => navigate(`/auction/${item.id}`)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 2,
                  mb: 2,
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease-in-out',
                  "&:hover": {
                    transform: 'translateY(-2px)',
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  },
                }}
              >
                {/* Left: Square Image */}
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
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
                    <strong>Time Left:</strong> <CountdownTimer endTime={item.end_time} />
                  </Typography>
                </Box>

                {/* Right: Actions (including Remove) */}
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  {/* Remove from favorites */}
                  <IconButton
                    size="small"
                    onClick={(e) => handleRemove(fav.id, e)}
                    sx={{
                      alignSelf: "flex-end",
                      color: "error.main",
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>

                  {/* Buy Now Price */}
                  {item.buy_now_price && (
                    <Typography
                      variant="body1"
                      sx={{
                        color: "black",
                        fontWeight: "bold",
                        fontSize: "0.95rem",
                      }}
                    >
                      Buy Now: ${item.buy_now_price}
                    </Typography>
                  )}

                  {/* Bidding */}
                  {canBid && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
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
                        sx={{ width: 100 }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handlePlaceBid(item.id)}
                        sx={{
                          backgroundColor: "#2e7d32",
                          color: "#fff",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          textTransform: "none",
                          padding: "4px 8px",
                          "&:hover": {
                            backgroundColor: "#1b5e20",
                          },
                        }}
                      >
                        BID
                      </Button>
                    </Box>
                  )}

                  {/* Buy Now */}
                  {canBuyNow && (
                    <Button
                      variant="contained"
                      onClick={(e) => openBuyNowModal(item, e)}
                      sx={{
                        backgroundColor: "#000",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        padding: "4px 8px",
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
    </Box>
  );
};

export default Favorites;
