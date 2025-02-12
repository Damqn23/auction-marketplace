import React, { useEffect, useState } from "react";
import axiosInstance from "../services/axiosConfig"; // Use the configured axios instance
import { Grid, Typography, Card, CardMedia, CardContent, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import styles from "./Favorites.module.css"; // Import CSS module

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    try {
      const response = await axiosInstance.get("/favorites/");
      console.log("Favorites response:", response.data);
      setFavorites(response.data);
    } catch (error) {
      console.error("Error fetching favorites", error);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (favId) => {
    try {
      await axiosInstance.delete(`/favorites/${favId}/`);
      fetchFavorites();
    } catch (error) {
      console.error("Error removing favorite", error);
    }
  };

  // Helper function to get the image URL similar to AuctionList.js logic
  const getAuctionImage = (auctionItem) => {
    if (auctionItem.images && auctionItem.images.length > 0) {
      return auctionItem.images[0].image;
    }
    if (auctionItem.image) {
      return auctionItem.image;
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <Typography variant="h4" className={styles.header} gutterBottom>
        Your Favorites
      </Typography>
      {favorites.length === 0 ? (
        <Typography variant="body1" className={styles.noFavorites}>
          No favorites yet.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {favorites.map((fav) => {
            const auctionItem = fav.auction_item;
            const imageUrl = getAuctionImage(auctionItem);

            return (
              <Grid item xs={12} sm={6} md={4} key={fav.id}>
                <Card
                  className={styles.card}
                  onClick={() => navigate(`/auction/${auctionItem.id}`)}
                >
                  {imageUrl ? (
                    <CardMedia
                      component="img"
                      className={styles.media}
                      image={imageUrl}
                      alt={auctionItem.title}
                    />
                  ) : (
                    <div className={styles.noImageFallback}>
                      <Typography variant="body2">No image</Typography>
                    </div>
                  )}
                  <CardContent className={styles.cardContent}>
                    <Typography variant="h6">
                      {auctionItem.title}
                    </Typography>
                    <IconButton
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(fav.id);
                      }}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </div>
  );
};

export default Favorites;
