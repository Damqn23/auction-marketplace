import React, { useState, useEffect, useContext } from "react";
import { createAuctionItem } from "../services/auctionService";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./CreateAuction.module.css";
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

const CreateAuction = () => {
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // New fields
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");

  // Images (multiple allowed)
  const [images, setImages] = useState([]);
  
  // Other state
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // Handle file selection using a hidden input triggered by a styled button
  const handleImageChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setImages(filesArray);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Simple validation: if buyNowPrice is set, ensure it’s higher than startingBid
    if (buyNowPrice && parseFloat(buyNowPrice) <= parseFloat(startingBid)) {
      setMessage("Buy Now price must be higher than the starting bid.");
      setLoading(false);
      return;
    }

    if (!endTime) {
      setMessage("End time is required.");
      setLoading(false);
      return;
    }
    
    if (!selectedCategory) {
      setMessage("Category selection is required.");
      setLoading(false);
      return;
    }

    // Build FormData to send to the backend
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("starting_bid", startingBid);
    formData.append("buy_now_price", buyNowPrice);
    formData.append("end_time", endTime);
    formData.append("category", selectedCategory);
    
    // New fields: condition and location
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

  return (
    <div className={styles.wrapper}>
      <Paper elevation={3} className={styles.container}>
        <Typography variant="h4" component="h2" gutterBottom>
          Create New Auction Listing
        </Typography>

        {message && (
          <Typography variant="body1" color="error" className={styles.message}>
            {message}
          </Typography>
        )}

        <form
          onSubmit={handleSubmit}
          className={styles.form}
          encType="multipart/form-data"
        >
          {/* Title */}
          <TextField
            label="Title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            margin="normal"
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
            margin="normal"
          />

          <Divider className={styles.divider} />

          {/* Starting Bid */}
          <TextField
            label="Starting Bid"
            variant="outlined"
            type="number"
            value={startingBid}
            onChange={(e) => setStartingBid(e.target.value)}
            required
            fullWidth
            margin="normal"
            inputProps={{ min: "0", step: "0.01" }}
          />

          {/* End Time */}
          <TextField
            label="End Time"
            variant="outlined"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <Divider className={styles.divider} />

          {/* Additional Details */}
          <TextField
            label="Condition"
            variant="outlined"
            select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            fullWidth
            required
            margin="normal"
          >
            <MenuItem value="">Select condition</MenuItem>
            <MenuItem value="New">New</MenuItem>
            <MenuItem value="Used">Used</MenuItem>
            <MenuItem value="Refurbished">Refurbished</MenuItem>
          </TextField>

          <TextField
            label="Location"
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            required
            margin="normal"
            placeholder="City, State or Country"
          />

          <Divider className={styles.divider} />

          {/* Images */}
          <Box mt={2} mb={2}>
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
              <Typography variant="caption" display="block">
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
            margin="normal"
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
            margin="normal"
          >
            <option value=""></option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </TextField>

          {/* Submit Button */}
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? (
                <CircularProgress size={24} style={{ color: "#fff" }} />
              ) : (
                "Create Auction"
              )}
            </Button>
          </Box>
        </form>

        <Box mt={2}>
          <Link to="/" className={styles.backLink}>
            Back to Auction List
          </Link>
        </Box>
      </Paper>
    </div>
  );
};

export default CreateAuction;
