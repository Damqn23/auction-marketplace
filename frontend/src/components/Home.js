import React, { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCategories } from "../services/categoryService";
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import { icons } from "./CategoryIcons";
import { useInView } from "react-intersection-observer";
import { Search, MenuBook, Create, EmojiNature, People, Gavel, EmojiEvents, LocalOffer } from "@mui/icons-material";

import Slider from "react-slick"; 
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// ----- Keyframe Animations -----
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  25% { background-position: 50% 50%; }
  50% { background-position: 100% 50%; }
  75% { background-position: 50% 50%; }
  100% { background-position: 0% 50%; }
`;

const textGlow = keyframes`
  from { text-shadow: 0 0 10px rgba(255, 255, 255, 0.7); }
  to { text-shadow: 0 0 20px rgba(255, 255, 255, 1); }
`;

const popUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Add new animations
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const gradientOverlay = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Add new animation for counter
const countUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Memoized AnimatedBox component
const AnimatedBox = memo(({ children, delay = "0s", ...props }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  return (
    <Box
      ref={ref}
      sx={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.8s ease ${delay}`,
      }}
      {...props}
    >
      {children}
    </Box>
  );
});

// Add new component for animated counter
const AnimatedCounter = memo(({ value, label, icon: Icon }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (inView) {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [inView, value]);

  return (
    <Box
      ref={ref}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 2,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s ease",
      }}
    >
      <Icon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
      <Typography
        variant="h3"
        sx={{
          fontWeight: "bold",
          color: "primary.main",
          animation: `${countUp} 0.5s ease-out`,
        }}
      >
        {count.toLocaleString()}+
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{
          color: "text.secondary",
          textAlign: "center",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
});

// Loading component
const LoadingState = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    }}
  >
    <CircularProgress />
  </Box>
);

// Error component
const ErrorState = ({ message }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
      {message}
    </Alert>
  </Box>
);

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized category click handler
  const handleCategoryClick = useCallback((catName) => {
    navigate(`/auction-list?category=${encodeURIComponent(catName)}`);
  }, [navigate]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        setError("Failed to load categories. Please try again later.");
        console.error("Error fetching categories:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // If loading
  if (isLoading) {
    return <LoadingState />;
  }

  // If error
  if (error) {
    return <ErrorState message={error} />;
  }

  // If no categories
  if (!categories.length) {
    return (
      <ErrorState message="No categories available at the moment. Please check back later." />
    );
  }

  // Decide how many categories to show in the slider
  const displayedSliderCats = categories.slice(0, 15);

  // React Slick settings for constant movement, no dots
  const settings = {
    centerMode: true,
    centerPadding: "100px",
    slidesToShow: 3,
    infinite: true,
    arrows: false,
    dots: false,
    autoplay: true,
    autoplaySpeed: 0,
    speed: 20000,
    cssEase: "linear",
    pauseOnHover: false,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerPadding: "40px",
        },
      },
    ],
  };

  return (
    <Box sx={{ overflowY: "auto", minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* ---------- HERO SECTION ---------- */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          color: "#fff",
          py: { xs: 8, md: 14 },
          px: { xs: 2, md: 4 },
          textAlign: "center",
          background: "linear-gradient(45deg, #ff6ec4, #7873f5, #24c6dc, #514a9d)",
          backgroundSize: "400% 400%",
          animation: `${gradientAnimation} 15s ease infinite`,
        }}
      >
        {/* Background Image Overlay with Pattern */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/images/gavel-3577258_1280.jpg)',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed", // Parallax effect
            opacity: 0.35,
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)",
              backgroundSize: "40px 40px",
              opacity: 0.5,
            }
          }}
        />
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
          <AnimatedBox delay="0.3s">
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2rem", md: "3.5rem" },
                fontWeight: "bold",
                mb: 2,
                animation: `${textGlow} 3s ease-in-out infinite alternate`,
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Discover Unique Auctions
            </Typography>
          </AnimatedBox>
          <AnimatedBox delay="0.6s">
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: "1.1rem", md: "1.5rem" },
                mb: 4,
                fontWeight: 300,
                textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              Find that perfect piece from a wide range of categories.
            </Typography>
          </AnimatedBox>
          <AnimatedBox delay="0.9s">
            <Button
              variant="contained"
              onClick={() => navigate("/auction-list")}
              sx={{
                backgroundColor: "secondary.main",
                color: "primary.contrastText",
                fontSize: "1.1rem",
                py: 1.5,
                px: 4,
                borderRadius: "30px",
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "secondary.dark",
                  transform: "scale(1.05)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              Start Exploring
            </Button>
          </AnimatedBox>
        </Container>
      </Box>

      {/* ---------- STATISTICS SECTION ---------- */}
      <Container maxWidth="lg" sx={{ py: 6, mt: -4, position: "relative", zIndex: 2 }}>
        <Box
          sx={{
            backgroundColor: "background.paper",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            p: 4,
          }}
        >
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={6} md={3}>
              <AnimatedCounter
                value={10000}
                label="Active Users"
                icon={People}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <AnimatedCounter
                value={5000}
                label="Active Auctions"
                icon={Gavel}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <AnimatedCounter
                value={25000}
                label="Items Sold"
                icon={EmojiEvents}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <AnimatedCounter
                value={1000000}
                label="Total Bids"
                icon={LocalOffer}
              />
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* ---------- CATEGORIES AREA ---------- */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <AnimatedBox>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              mb: 6,
              fontWeight: "bold",
              color: "primary.main",
              fontSize: { xs: "1.75rem", md: "2.5rem" },
              position: "relative",
              "&::after": {
                content: '""',
                width: 80,
                height: 4,
                background: "linear-gradient(90deg, #ff6ec4, #7873f5)",
                backgroundSize: "200% 200%",
                animation: `${gradientOverlay} 3s ease infinite`,
                display: "block",
                mx: "auto",
                borderRadius: 2,
                mt: 1,
              },
            }}
          >
            Browse Categories
          </Typography>
        </AnimatedBox>

        {showAll ? (
          // ---------- SHOW ALL in a Grid ----------
          <Box>
            <Grid container spacing={4} justifyContent="center">
              {categories.map((cat, idx) => {
                const IconComponent = icons[cat.name] || icons["Uncategorized"];
                return (
                  <Grid
                    item
                    key={cat.id}
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    onClick={() => handleCategoryClick(cat.name)}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": { transform: "translateY(-5px)" },
                    }}
                  >
                    <AnimatedBox delay={`${idx * 0.01}s`}>
                      <Card
                        sx={{
                          borderRadius: "12px",
                          p: { xs: 2, md: 3 },
                          boxShadow: 3,
                          textAlign: "center",
                          position: "relative",
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0))",
                            opacity: 0,
                            transition: "opacity 0.3s ease",
                          },
                          "&:hover": {
                            transform: "translateY(-5px) scale(1.03)",
                            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
                            "&::before": {
                              opacity: 1,
                            },
                            "& .MuiSvgIcon-root": {
                              animation: `${floatAnimation} 2s ease-in-out infinite`,
                            },
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <IconComponent
                            sx={{
                              fontSize: "50px",
                              color: "primary.main",
                              mb: 2,
                              transition: "all 0.3s ease",
                            }}
                          />
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontSize: "1.2rem",
                              fontWeight: 500,
                              color: "primary.main",
                              transition: "color 0.3s ease",
                            }}
                          >
                            {cat.name}
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedBox>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ) : (
          // ---------- SLIDER of the first 15 categories ----------
          <Box sx={{ mx: { xs: -2, md: 0 } }}>
            <Slider
              centerMode
              centerPadding="100px"
              slidesToShow={3}
              infinite
              arrows={false}
              dots={false}
              autoplay
              autoplaySpeed={0}
              speed={3000}
              cssEase="linear"
              pauseOnHover={false}
              responsive={[
                {
                  breakpoint: 768,
                  settings: {
                    slidesToShow: 1,
                    centerPadding: "40px",
                  },
                },
              ]}
            >
              {displayedSliderCats.map((cat) => {
                const IconComponent = icons[cat.name] || icons["Uncategorized"];
                return (
                  <Box key={cat.id} sx={{ px: 2 }}>
                    <Card
                      onClick={() => handleCategoryClick(cat.name)}
                      sx={{
                        borderRadius: 2,
                        boxShadow: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.03)" },
                        py: 3,
                      }}
                    >
                      <CardContent
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <IconComponent
                          sx={{
                            fontSize: 50,
                            color: "primary.main",
                            mb: 2,
                          }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontSize: "1.2rem",
                            fontWeight: 500,
                            color: "primary.main",
                          }}
                        >
                          {cat.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Slider>
          </Box>
        )}

        {/* Toggle ShowAll Button */}
        <Box textAlign="center" mt={6}>
          <Button
            variant="contained"
            onClick={() => setShowAll(!showAll)}
            sx={{
              mt: 2,
              px: 4,
              py: 1,
              borderRadius: "25px",
              background: "linear-gradient(45deg, #ff6ec4, #7873f5)",
              backgroundSize: "200% 200%",
              animation: `${gradientOverlay} 3s ease infinite`,
              color: "#fff",
              fontSize: "1rem",
              textTransform: "none",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              },
            }}
          >
            {showAll ? "Show Less" : "See All Categories"}
          </Button>
        </Box>
      </Container>

      {/* ---------- SECOND IMAGE SECTION ---------- */}
      <AnimatedBox>
        <Box
          sx={{
            backgroundImage: 'url(/images/money-2180330_1280.jpg)',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed", // Parallax effect
            height: { xs: "300px", md: "500px" },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            mt: 8,
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(45deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3))",
            }
          }}
        >
          <Box sx={{ position: "relative", zIndex: 2, textAlign: "center", px: 2 }}>
            <Typography
              variant="h3"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                fontSize: { xs: "1.8rem", md: "3rem" },
                mb: 1,
                animation: `${textGlow} 3s ease-in-out infinite alternate`,
              }}
            >
              Starting from just $0.01!
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontWeight: 300,
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              No matter your budget, you can join an auction and start bidding today.
            </Typography>
          </Box>
        </Box>
      </AnimatedBox>

      {/* ---------- HOW IT WORKS SECTION ---------- */}
      <Container
        maxWidth="lg"
        sx={{
          py: 8,
          px: { xs: 2, md: 4 },
          backgroundColor: "#f5f5f5",
          mt: 8,
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <AnimatedBox>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              color: "primary.main",
              fontWeight: "bold",
              mb: 6,
              position: "relative",
              "&::after": {
                content: '""',
                width: 80,
                height: 4,
                background: "linear-gradient(90deg, #ff6ec4, #7873f5)",
                backgroundSize: "200% 200%",
                animation: `${gradientOverlay} 3s ease infinite`,
                display: "block",
                mx: "auto",
                borderRadius: 2,
                mt: 1,
              },
            }}
          >
            How It Works
          </Typography>
        </AnimatedBox>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <AnimatedBox delay="0.2s">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 3,
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    backgroundColor: "rgba(255,255,255,0.5)",
                  },
                }}
              >
                <MenuBook
                  sx={{
                    fontSize: 80,
                    color: "primary.main",
                    mb: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}
                >
                  Search Auctions
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: "text.secondary" }}>
                  Browse through thousands of unique items with ease.
                </Typography>
              </Box>
            </AnimatedBox>
          </Grid>
          <Grid item xs={12} md={4}>
            <AnimatedBox delay="0.4s">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Create sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}
                >
                  Place Your Bid
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: "text.secondary" }}>
                  Enter competitive bids and secure your chance to win.
                </Typography>
              </Box>
            </AnimatedBox>
          </Grid>
          <Grid item xs={12} md={4}>
            <AnimatedBox delay="0.6s">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <EmojiNature sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}
                >
                  Win & Enjoy
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: "text.secondary" }}>
                  Celebrate your win and enjoy your prized item.
                </Typography>
              </Box>
            </AnimatedBox>
          </Grid>
        </Grid>
        <Box textAlign="center" mt={6}>
          <AnimatedBox delay="0.8s">
            <Button
              variant="contained"
              onClick={() => navigate("/auction-list")}
              sx={{
                background: "linear-gradient(45deg, #ff6ec4, #7873f5)",
                backgroundSize: "200% 200%",
                animation: `${gradientOverlay} 3s ease infinite`,
                color: "#fff",
                fontSize: "1.1rem",
                py: 1.5,
                px: 4,
                borderRadius: "30px",
                textTransform: "none",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                },
              }}
            >
              Explore Auctions
            </Button>
          </AnimatedBox>
        </Box>
      </Container>

      {/* ---------- FOOTER ---------- */}
      <Box
        sx={{
          background: "linear-gradient(45deg, #ff6ec4, #7873f5)",
          backgroundSize: "200% 200%",
          animation: `${gradientOverlay} 3s ease infinite`,
          color: "#fff",
          textAlign: "center",
          py: 3,
          mt: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body1" sx={{ fontSize: "0.9rem" }}>
            &copy; {new Date().getFullYear()} Auction Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
