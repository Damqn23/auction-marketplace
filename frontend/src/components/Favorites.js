import React, { useEffect, useState } from "react";
import axiosInstance from "../services/axiosConfig";
import { Grid, Typography, Card, CardMedia, CardContent, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@emotion/react";

const zoomIn = keyframes`
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.05);
  }
`;

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
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2b5876, #4e4376)",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: "#fff",
          textAlign: "center",
          mb: 4,
          fontWeight: "bold",
          textShadow: "1px 1px 4px rgba(0,0,0,0.5)",
        }}
      >
        Your Favorites
      </Typography>
      {favorites.length === 0 ? (
        <Typography
          variant="body1"
          sx={{ color: "#fff", textAlign: "center", mt: 2 }}
        >
          No favorites yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((fav) => {
            const auctionItem = fav.auction_item;
            const imageUrl = getAuctionImage(auctionItem);
            return (
              <Grid item xs={12} sm={6} md={4} key={fav.id}>
                <Card
                  onClick={() => navigate(`/auction/${auctionItem.id}`)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 3,
                    overflow: "hidden",
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(5px)",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    position: "relative",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.3)",
                    },
                  }}
                >
                  {imageUrl ? (
                    <CardMedia
                      component="img"
                      image={imageUrl}
                      alt={auctionItem.title}
                      sx={{
                        height: 250,
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                        "&:hover": { animation: `${zoomIn} 0.3s forwards` },
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 250,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.2)",
                        color: "#fff",
                      }}
                    >
                      <Typography variant="body2">No image</Typography>
                    </Box>
                  )}
                  <CardContent
                    sx={{
                      p: 2,
                      background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                      color: "#fff",
                      position: "relative",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        m: 0,
                        fontWeight: "bold",
                        textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      {auctionItem.title}
                    </Typography>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(fav.id);
                      }}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(5px)",
                        borderRadius: "50%",
                        transition: "background 0.3s ease",
                        "&:hover": { background: "rgba(255, 255, 255, 0.4)" },
                        color: "#fff",
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Favorites;
