import React, { useState, useEffect, useContext } from "react";
import { getAuctionItem, updateAuctionItem } from "../services/auctionService";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../contexts/UserContext";
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";
import { keyframes } from "@emotion/react";

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const UpdateAuction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasBidsOrEnded, setHasBidsOrEnded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchAuctionItemData = async () => {
      try {
        const data = await getAuctionItem(id);

        // Check if user is the owner
        if (!user || user.username !== data.owner.username) {
          toast.error("You are not authorized to update this auction item.");
          navigate("/");
          return;
        }

        // If it has bids or has ended, block
        if ((data.bids && data.bids.length > 0) || new Date(data.end_time) <= new Date()) {
          setHasBidsOrEnded(true);
          toast.info("This auction cannot be updated (it has bids or ended).");
          setLoading(false);
          return;
        }

        // Set existing images
        setExistingImages(data.images || []);
      } catch (err) {
        console.error("Error fetching auction item:", err);
        setErrorMessage("Error fetching auction item");
        toast.error("Error fetching auction item.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionItemData();
    // eslint-disable-next-line
  }, [id, user]);

  // Only add new images
  const handleImageChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setNewImages(filesArray);
  };

  // Submit new images to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newImages.length === 0) {
      toast.info("No new images selected.");
      return;
    }

    try {
      const formData = new FormData();
      // Append only the new images
      newImages.forEach((file) => {
        formData.append("images", file);
      });

      await updateAuctionItem(id, formData);
      toast.success("Images added successfully!");
      navigate("/");
    } catch (err) {
      console.error("Error adding images:", err);
      setErrorMessage("Failed to add images. Please try again.");
      toast.error("Failed to update auction item.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (hasBidsOrEnded) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, p: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            maxWidth: 600,
            width: "100%",
            borderRadius: 2,
            textAlign: "center",
            animation: `${fadeIn} 0.8s ease-in-out`,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Update Auction Item
          </Typography>
          <Typography variant="body1">
            This auction has bids or is already ended, so you can’t add images.
          </Typography>
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/")}
            >
              Back to Auction List
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4, p: 2 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          maxWidth: 600,
          width: "100%",
          borderRadius: 2,
          animation: `${fadeIn} 0.8s ease-in-out`,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Add More Images
        </Typography>

        {errorMessage && (
          <Typography variant="body1" color="error" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          sx={{
            mt: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Existing Images:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {existingImages.map((img) => (
                  <Box
                    key={img.id}
                    component="img"
                    src={img.image}
                    alt="Auction"
                    sx={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid #ccc",
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* New Images */}
          <Box>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Select New Images to Add:
            </Typography>
            <Button variant="outlined" component="label">
              Choose Files
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImageChange}
              />
            </Button>
            {newImages.length > 0 && (
              <Typography variant="caption" display="block">
                {newImages.length} image(s) selected
              </Typography>
            )}
          </Box>

          <Button type="submit" variant="contained" color="primary">
            Add Images
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#1976d2" }}>
            Back to Auction List
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default UpdateAuction;
