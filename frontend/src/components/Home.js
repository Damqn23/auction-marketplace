import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { keyframes } from "@emotion/react";
import { icons } from "./CategoryIcons";
import { useInView } from "react-intersection-observer";

import { MenuBook, Create, EmojiNature } from "@mui/icons-material";

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

// Intersection Observer helper for reveal animations
const AnimatedBox = ({ children, delay = "0s", ...props }) => {
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
};

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    getAllCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // If still loading or empty
  if (!categories.length) {
    return (
      <Typography sx={{ p: 2, textAlign: "center" }}>
        Loading categories...
      </Typography>
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

  const handleCategoryClick = (catName) => {
    navigate(`/auction-list?category=${encodeURIComponent(catName)}`);
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
        {/* Background Image Overlay */}
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
            opacity: 0.35,
          }}
        />
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
          <AnimatedBox delay="0.3s">
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: "bold",
                mb: 2,
                animation: `${textGlow} 3s ease-in-out infinite alternate`,
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
                transition: "background-color 0.3s ease, transform 0.3s ease",
                "&:hover": {
                  backgroundColor: "secondary.dark",
                  transform: "scale(1.05)",
                },
              }}
            >
              Start Exploring
            </Button>
          </AnimatedBox>
        </Container>
      </Box>

      {/* ---------- CATEGORIES AREA ---------- */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <AnimatedBox>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              mb: 4,
              fontWeight: "bold",
              color: "primary.main",
              fontSize: { xs: "1.75rem", md: "2.5rem" },
              position: "relative",
              "&::after": {
                content: '""',
                width: 80,
                height: 4,
                background: "primary.main",
                display: "block",
                mx: "auto",
                borderRadius: 2,
                mt: 1,
                animation: `${popUp} 2s ease-out`,
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
                      transition: "transform 0.3s ease",
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
                          transition: "transform 0.3s ease, box-shadow 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-5px) scale(1.03)",
                            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
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
                            sx={{ fontSize: "50px", color: "primary.main", mb: 2 }}
                          />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontSize: "1.2rem", fontWeight: 500, color: "primary.main" }}
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
              backgroundColor: "primary.main",
              color: "#fff",
              fontSize: "1rem",
              textTransform: "none",
              transition: "background-color 0.3s ease",
              "&:hover": {
                backgroundColor: "primary.dark",
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
            height: { xs: "300px", md: "500px" },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            mt: 8,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2, textAlign: "center", px: 2 }}>
            <Typography
              variant="h3"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                fontSize: { xs: "1.8rem", md: "3rem" },
                mb: 1,
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
        }}
      >
        <AnimatedBox>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ color: "primary.main", fontWeight: "bold", mb: 4 }}
          >
            How It Works
          </Typography>
        </AnimatedBox>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <AnimatedBox delay="0.2s">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <MenuBook sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
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
                backgroundColor: "secondary.main",
                color: "primary.contrastText",
                fontSize: "1.1rem",
                py: 1.5,
                px: 4,
                borderRadius: "30px",
                textTransform: "none",
                transition: "background-color 0.3s ease, transform 0.3s ease",
                "&:hover": {
                  backgroundColor: "secondary.dark",
                  transform: "scale(1.05)",
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
          backgroundColor: "primary.main",
          color: "#fff",
          textAlign: "center",
          py: 2,
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
