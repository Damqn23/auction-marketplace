import React, { useState, useEffect, useContext } from "react";
import { getAuctionItem, updateAuctionItem } from "../services/auctionService";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./CreateAuction.module.css"; // Reuse the create page styles for consistency
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

const UpdateAuction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // Fields similar to the create page
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  // New images state: for new images (multiple allowed)
  const [newImages, setNewImages] = useState([]);
  // To show existing images
  const [existingImages, setExistingImages] = useState([]);

  // Other state
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasBids, setHasBids] = useState(false);
  const [categories, setCategories] = useState([]);

  // Handle file selection for new images
  const handleImageChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setNewImages(filesArray);
  };

  // Fetch categories (same as in create page)
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

  // Fetch the auction item details
  useEffect(() => {
    const fetchAuctionItemData = async () => {
      try {
        const data = await getAuctionItem(id);
        // Check ownership (assuming data.owner is an object with a username)
        if (user && user.username !== data.owner.username) {
          toast.error("You are not authorized to update this auction item.");
          navigate("/");
          return;
        }
        // Prevent update if the auction has bids or has ended
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
        // Pre-fill the form fields with existing data
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

    // Build FormData with updated fields
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("starting_bid", startingBid);
    formData.append("buy_now_price", buyNowPrice);
    // end_time is not updated here
    formData.append("category", selectedCategory);
    formData.append("condition", condition);
    formData.append("location", location);

    // Append any new images
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

  if (loading) return <p>Loading...</p>;

  if (hasBids) {
    return (
      <div className={styles.wrapper}>
        <Paper elevation={3} className={styles.container}>
          <Typography variant="h4" component="h2" gutterBottom>
            Update Auction Item
          </Typography>
          <Typography variant="body1">
            This auction has received bids and cannot be updated.
          </Typography>
          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={() => navigate("/")}>
              Back to Auction List
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Paper elevation={3} className={styles.container}>
        <Typography variant="h4" component="h2" gutterBottom>
          Update Auction Item
        </Typography>

        {message && (
          <Typography variant="body1" color="error" className={styles.message}>
            {message}
          </Typography>
        )}

        <form onSubmit={handleSubmit} className={styles.form} encType="multipart/form-data">
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

          {/* Images */}
          <Box mt={2} mb={2}>
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
                onChange={handleImageChange}
              />
            </Button>
            {newImages.length > 0 && (
              <Typography variant="caption" display="block">
                {newImages.length} image(s) selected
              </Typography>
            )}
            {/* Display any existing images */}
            {existingImages.length > 0 && (
              <Box mt={2}>
                <Typography variant="body2">Existing Images:</Typography>
                {existingImages.map((img) => (
                  <img
                    key={img.id}
                    src={img.image}
                    alt="Auction"
                    style={{ width: "100px", marginRight: "10px" }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Submit Button */}
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button type="submit" variant="contained" color="primary" className={styles.submitButton}>
              Update Auction
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

export default UpdateAuction;
