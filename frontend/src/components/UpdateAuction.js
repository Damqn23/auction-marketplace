import React, { useState, useEffect, useContext } from "react";
import { getAuctionItem, updateAuctionItem } from "../services/auctionService";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../contexts/UserContext";
import { getAllCategories } from "../services/categoryService";
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
  MenuItem,
  Divider,
} from "@mui/material";
import { keyframes } from "@emotion/react";

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const UpdateAuction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasBids, setHasBids] = useState(false);
  const [categories, setCategories] = useState([]);

  const handleImageChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setNewImages(filesArray);
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch auction item details
  useEffect(() => {
    const fetchAuctionItemData = async () => {
      try {
        const data = await getAuctionItem(id);
        // Check ownership
        if (user && user.username !== data.owner.username) {
          toast.error("You are not authorized to update this auction item.");
          navigate("/");
          return;
        }
        // Prevent update if bids exist or auction has ended
        if (data.bids && data.bids.length > 0) {
          setHasBids(true);
          toast.info("This auction has received bids and cannot be updated.");
          setLoading(false);
          return;
        }
        if (new Date(data.end_time) <= new Date()) {
          setHasBids(true);
          toast.info("This auction has already ended and cannot be updated.");
          setLoading(false);
          return;
        }
        // Pre-fill form
        setTitle(data.title);
        setDescription(data.description);
        setStartingBid(data.starting_bid);
        setBuyNowPrice(data.buy_now_price || "");
        setSelectedCategory(data.category);
        setCondition(data.condition);
        setLocation(data.location);
        setExistingImages(data.images || []);
        setLoading(false);
      } catch (err) {
        setMessage("Error fetching auction item");
        console.error("Error:", err);
        toast.error("Error fetching auction item.");
        setLoading(false);
      }
    };
    fetchAuctionItemData();
    // eslint-disable-next-line
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("starting_bid", startingBid);
    formData.append("buy_now_price", buyNowPrice);
    formData.append("category", selectedCategory);
    formData.append("condition", condition);
    formData.append("location", location);

    newImages.forEach((imageFile) => {
      formData.append("images", imageFile);
    });

    try {
      await updateAuctionItem(id, formData);
      toast.success("Auction item updated successfully!");
      navigate("/");
    } catch (err) {
      setMessage("Error updating auction item");
      console.error("Error:", err);
      toast.error("Failed to update auction item. Please try again.");
    }
  };

  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );

  if (hasBids) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 4,
          p: 2,
        }}
      >
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
            This auction has received bids and cannot be updated.
          </Typography>
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/")}
              sx={{ textTransform: "none" }}
            >
              Back to Auction List
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mt: 4,
        p: 2,
      }}
    >
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
          Update Auction Item
        </Typography>

        {message && (
          <Typography variant="body1" color="error" sx={{ mt: 1 }}>
            {message}
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
            animation: `${slideUp} 0.5s ease-out`,
          }}
        >
          {/* Title */}
          <TextField
            label="Title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#d4a373" },
                "&:hover fieldset": { borderColor: "#c5894f" },
                "&.Mui-focused fieldset": { borderColor: "#a67c52" },
              },
            }}
          />

          {/* Description */}
          <TextField
            label="Description"
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#d4a373" },
                "&:hover fieldset": { borderColor: "#c5894f" },
                "&.Mui-focused fieldset": { borderColor: "#a67c52" },
              },
            }}
          />

          <Divider />

          {/* Starting Bid */}
          <TextField
            label="Starting Bid"
            variant="outlined"
            type="number"
            value={startingBid}
            onChange={(e) => setStartingBid(e.target.value)}
            required
            fullWidth
            inputProps={{ min: "0", step: "0.01" }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#d4a373" },
                "&:hover fieldset": { borderColor: "#c5894f" },
                "&.Mui-focused fieldset": { borderColor: "#a67c52" },
              },
            }}
          />

          {/* Buy Now Price */}
          <TextField
            label="Buy Now Price (Optional)"
            variant="outlined"
            type="number"
            value={buyNowPrice}
            onChange={(e) => setBuyNowPrice(e.target.value)}
            fullWidth
            inputProps={{
              min: parseFloat(startingBid) + 0.01 || 0,
              step: "0.01",
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#d4a373" },
                "&:hover fieldset": { borderColor: "#c5894f" },
                "&.Mui-focused fieldset": { borderColor: "#a67c52" },
              },
            }}
          />

          <Divider />

          {/* Condition */}
          <TextField
            label="Condition"
            variant="outlined"
            select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            fullWidth
            required
          >
            <MenuItem value="">Select condition</MenuItem>
            <MenuItem value="New">New</MenuItem>
            <MenuItem value="Used">Used</MenuItem>
            <MenuItem value="Refurbished">Refurbished</MenuItem>
          </TextField>

          {/* Location */}
          <TextField
            label="Location"
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            required
            placeholder="City, State or Country"
          />

          <Divider />

          {/* Category */}
          <TextField
            select
            label="Category"
            variant="outlined"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            fullWidth
            required
            SelectProps={{ native: true }}
          >
            <option value=""></option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </TextField>

          {/* Images */}
          <Box>
            <Typography variant="body1" gutterBottom>
              Upload New Images (optional, multiple allowed):
            </Typography>
            <Button variant="outlined" component="label">
              Select Images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const filesArray = Array.from(e.target.files);
                  setNewImages(filesArray);
                }}
              />
            </Button>
            {newImages.length > 0 && (
              <Typography variant="caption" display="block">
                {newImages.length} image(s) selected
              </Typography>
            )}
            {existingImages.length > 0 && (
              <Box mt={2} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2">Existing Images:</Typography>
                {existingImages.map((img) => (
                  <Box
                    key={img.id}
                    component="img"
                    src={img.image}
                    alt="Auction"
                    sx={{
                      width: 100,
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Submit Button */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" color="primary" sx={{ textTransform: "none" }}>
              Update Auction
            </Button>
          </Box>
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
