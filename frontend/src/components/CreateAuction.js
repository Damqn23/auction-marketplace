import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import { toast } from "react-toastify";

import { createAuctionItem } from "../services/auctionService";
import { getAllCategories } from "../services/categoryService";
import { UserContext } from "../contexts/UserContext";

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
  // ------------------ States ------------------
  const [activeStep, setActiveStep] = useState(0);

  // Basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Pricing
  const [startingBid, setStartingBid] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [duration, setDuration] = useState("1");

  // Condition & Images
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState([]);

  // Other
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // ------------------ Stepper Logic ------------------
  const steps = [
    t("createAuctionPage.steps.basic"),
    t("createAuctionPage.steps.pricing"),
    t("createAuctionPage.steps.condition"),
    t("createAuctionPage.steps.review"),
  ];

  const handleNext = () => {
    setErrorMsg("");
    // Optional: you could validate step-by-step before moving on
    if (activeStep === 0) {
      // Basic info validation
      if (!title || !description || !selectedCategory) {
        setErrorMsg("Please fill out all required fields.");
        return;
      }
    } else if (activeStep === 1) {
      // Pricing validation
      if (!startingBid || !duration) {
        setErrorMsg("Please fill out the required pricing fields.");
        return;
      }
      // If buyNowPrice is set, ensure it's higher than startingBid
      if (buyNowPrice && parseFloat(buyNowPrice) <= parseFloat(startingBid)) {
        setErrorMsg("Buy Now price must be higher than the starting bid.");
        return;
      }
    } else if (activeStep === 2) {
      // Condition & location validation
      if (!condition || !location) {
        setErrorMsg("Please select condition and location.");
        return;
      }
      // images are optional, no check needed
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg("");
    setActiveStep((prev) => prev - 1);
  };

  // ------------------ Final Submit ------------------
  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // Compute end time
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

      images.forEach((imgFile) => {
        formData.append("images", imgFile);
      });

      await createAuctionItem(formData);
      
      // Invalidate and refetch all pages of the infinite query
      await queryClient.invalidateQueries({
        queryKey: ["auctionItems"],
        refetchType: 'all'
      });
      
      // Force a reset of the infinite query data
      queryClient.resetQueries({
        queryKey: ["auctionItems"],
        exact: false
      });

      toast.success(t("auction.toasts.createSuccess"));
      navigate("/"); // redirect to home or anywhere
    } catch (err) {
      console.error(err);
      toast.error("Failed to create auction. Please try again.");
    }

    setLoading(false);
  };

  // ------------------ Load Categories & Cities ------------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catData = await getAllCategories();
        setCategories(catData);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // Load Bulgarian cities or any other city data
    fetch("/data/bg.json")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.city.localeCompare(b.city));
        setCities(sorted);
      })
      .catch((error) => console.error("Error fetching cities:", error));
  }, []);

  // ------------------ Step Content ------------------
  const renderStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label={t("createAuctionPage.labels.title")} variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label={t("createAuctionPage.labels.description")} variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
            />
            <TextField
              select
              label={t("createAuctionPage.labels.category")} variant="outlined"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="">-- Select Category --</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label={t("createAuctionPage.labels.startingBid")} variant="outlined"
              type="number"
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
              required
              fullWidth
              inputProps={{ min: "0", step: "0.01" }}
            />
            <TextField
              label={t("createAuctionPage.labels.buyNowPrice")} variant="outlined"
              type="number"
              value={buyNowPrice}
              onChange={(e) => setBuyNowPrice(e.target.value)}
              fullWidth
              inputProps={{
                min: parseFloat(startingBid) + 0.01 || 0,
                step: "0.01",
              }}
            />
            <TextField
              select
              label={t("createAuctionPage.labels.duration")} variant="outlined"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              fullWidth
            >
              <MenuItem value="1">1 Hour</MenuItem>
              <MenuItem value="3">3 Hours</MenuItem>
              <MenuItem value="6">6 Hours</MenuItem>
              <MenuItem value="12">12 Hours</MenuItem>
              <MenuItem value="24">24 Hours</MenuItem>
            </TextField>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label={t("filters.condition")} variant="outlined"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="">-- Select Condition --</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Used">Used</MenuItem>
              <MenuItem value="Refurbished">Refurbished</MenuItem>
            </TextField>
            <TextField
              select
              label={t("filters.location")} variant="outlined"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="">-- Select City --</MenuItem>
              {cities.map((c) => (
                <MenuItem key={c.city} value={c.city}>
                  {c.city}
                </MenuItem>
              ))}
            </TextField>
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Upload Images (optional)
              </Typography>
              <Button variant="outlined" component="label">
                Select Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setImages(files);
                  }}
                />
              </Button>
              {images.length > 0 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {images.length} image(s) selected
                </Typography>
              )}
            </Box>
          </Box>
        );
      case 3:
        // Review & Create
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Review Your Auction
            </Typography>
            <Divider />
            <Typography variant="body1">
              <strong>Title:</strong> {title}
            </Typography>
            <Typography variant="body1">
              <strong>Description:</strong> {description}
            </Typography>
            <Typography variant="body1">
              <strong>Category:</strong>{" "}
              {categories.find((cat) => cat.id === Number(selectedCategory))
                ?.name || "(None)"}
            </Typography>
            <Divider />
            <Typography variant="body1">
              <strong>Starting Bid:</strong> ${startingBid}
            </Typography>
            <Typography variant="body1">
              <strong>Buy Now Price:</strong>{" "}
              {buyNowPrice ? `$${buyNowPrice}` : "N/A"}
            </Typography>
            <Typography variant="body1">
              <strong>Duration (hrs):</strong> {duration}
            </Typography>
            <Divider />
            <Typography variant="body1">
              <strong>Condition:</strong> {condition}
            </Typography>
            <Typography variant="body1">
              <strong>Location:</strong> {location}
            </Typography>
            <Typography variant="body1">
              <strong>Images:</strong> {images.length} file(s) selected
            </Typography>
          </Box>
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 3,
        background: "linear-gradient(135deg, #f0f4f8 0%, #f7f9fc 100%)",
        mt: { xs: '64px', sm: '72px' },
        pt: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 700,
          mx: "auto",
          p: 3,
          borderRadius: 2,
          animation: `${fadeInScale} 0.6s ease-in-out`,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 2, fontWeight: "bold" }}
        >
          Create New Auction
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error message */}
        {errorMsg && (
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Typography>
        )}

        {/* Step content */}
        <Box sx={{ mb: 3 }}>{renderStepContent(activeStep)}</Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                t("createAuction")
              )}
            </Button>
          )}
        </Box>

        {/* Back to Auction List */}
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#1976d2" }}>
            Back to Auction List
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateAuction;
