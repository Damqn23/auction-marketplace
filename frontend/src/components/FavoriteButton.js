// frontend/src/components/FavoriteButton.js
import React, { useState, useEffect } from "react";
import { IconButton } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import axiosInstance from "../services/axiosConfig";

const FavoriteButton = ({ auctionItemId, auctionId }) => {
  // Support both prop names (auctionItemId preferred, auctionId as legacy alias)
  const itemId = auctionItemId ?? auctionId;
  const [favorite, setFavorite] = useState(null);

  // Check if the auction item is already favorited by the user
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axiosInstance.get("/favorites/");
        // Assuming response data is an array of favorites,
        // where each favorite has an auction_item property
        const fav = response.data.find(
          (f) => f.auction_item.id === itemId
        );
        setFavorite(fav || null);
      } catch (error) {
        console.error("Error fetching favorites", error);
      }
    };
    fetchFavorites();
  }, [itemId]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent event bubbling
    try {
      if (favorite) {
        // Remove favorite
        await axiosInstance.delete(`/favorites/${favorite.id}/`);
        setFavorite(null);
      } else {
        // Add favorite
        const response = await axiosInstance.post("/favorites/", {
          auction_item_id: itemId,
        });
        setFavorite(response.data);
      }
    } catch (error) {
      console.error("Error updating favorite", error);
    }
  };

  return (
    <IconButton
      onClick={handleToggleFavorite}
      // Use a specific red color (#f44336) and add a transition for smooth effect.
      sx={{
        color: favorite ? "#f44336" : "inherit",
        transition: "color 0.3s ease",
      }}
    >
      {favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
    </IconButton>
  );
};

export default FavoriteButton;
