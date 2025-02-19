import React, { useState, useEffect, useContext } from "react";
import { createAuctionItem } from "../services/auctionService";
import { useNavigate, Link } from "react-router-dom";
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

const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const CreateAuction = () => {
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Additional details
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");

  // Auction duration (in hours)
  const [duration, setDuration] = useState("1");

  // Images
  const [images, setImages] = useState([]);

  // Other state
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // New state for cities
  const [cities, setCities] = useState([]);

  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const handleImageChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setImages(filesArray);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Validate: if buyNowPrice is set, it must be higher than startingBid
    if (buyNowPrice && parseFloat(buyNowPrice) <= parseFloat(startingBid)) {
      setMessage("Buy Now price must be higher than the starting bid.");
      setLoading(false);
      return;
    }
    if (!selectedCategory) {
      setMessage("Category selection is required.");
      setLoading(false);
      return;
    }

    // Compute end time based on current time plus selected duration (in hours)
    const now = new Date();
    now.setHours(now.getHours() + parseInt(duration, 10));
    const computedEndTime = now.toISOString();

    // Build FormData
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("starting_bid", startingBid);
    formData.append("buy_now_price", buyNowPrice);
    formData.append("end_time", computedEndTime);
    formData.append("category", selectedCategory);
    formData.append("condition", condition);
    formData.append("location", location);

    images.forEach((imageFile) => {
      formData.append("images", imageFile);
    });

    try {
      await createAuctionItem(formData);
      toast.success("Auction item created successfully!");
      navigate("/");
    } catch (err) {
      setMessage("Error creating auction item");
      console.error("Error:", err);
      toast.error("Failed to create auction item. Please try again.");
    }

    setLoading(false);
  };

  // Fetch categories on component mount
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

  // Fetch Bulgarian cities from the local bg.json file
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


  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        p: 3,
        background: "linear-gradient(135deg, #dfe9f3, #ffffff)",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: "650px",
          p: 4,
          borderRadius: 2,
          animation: `${fadeInScale} 0.6s ease-in-out`,
          backgroundColor: "rgba(255,255,255,0.98)",
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ textAlign: "center", mb: 3, fontWeight: "bold", color: "#333" }}
        >
          Create New Auction Listing
        </Typography>

        {message && (
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {message}
          </Typography>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Title */}
          <TextField
            label="Title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
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
          />

          <Divider sx={{ my: 2 }} />

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
          />

          {/* Auction Duration */}
          <TextField
            select
            label="Auction Duration (hours)"
            variant="outlined"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            fullWidth
          >
            <MenuItem value="1">1 Hour</MenuItem>
            <MenuItem value="3">3 Hours</MenuItem>
            <MenuItem value="6">6 Hours</MenuItem>
            <MenuItem value="12">12 Hours</MenuItem>
          </TextField>

          <Divider sx={{ my: 2 }} />

          {/* Additional Details */}
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

          {/* Location (Select from Bulgarian cities) */}
          <TextField
            select
            label="Location"
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            required
            helperText="Select your city/region"
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

          <Divider sx={{ my: 2 }} />

          {/* Images */}
          <Box>
            <Typography variant="body1" gutterBottom>
              Upload Images (optional, multiple allowed):
            </Typography>
            <Button variant="outlined" component="label">
              Select Images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImageChange}
              />
            </Button>
            {images.length > 0 && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {images.length} image(s) selected
              </Typography>
            )}
          </Box>

          {/* Buy Now Price (Optional) */}
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
          />

          {/* Category */}
          <TextField
            select
            label="Category"
            variant="outlined"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            SelectProps={{ native: true }}
            fullWidth
            required
          >
            <option value=""></option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </TextField>

          {/* Submit Button */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                textTransform: "none",
                fontSize: "1rem",
                py: 1.5,
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Create Auction"
              )}
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link
            to="/"
            style={{ textDecoration: "none", color: "#1976d2", fontWeight: 500 }}
          >
            Back to Auction List
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateAuction;
