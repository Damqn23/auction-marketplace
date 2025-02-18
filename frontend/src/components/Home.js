import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCategories } from '../services/categoryService';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import { icons } from './CategoryIcons';

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

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ripple = keyframes`
  to { transform: scale(4); opacity: 0; }
`;

const floatOrb1 = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(60px, 60px) scale(1.1); }
  100% { transform: translate(0, 0) scale(1); }
`;

const floatOrb2 = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-60px, -60px) scale(1.1); }
  100% { transform: translate(0, 0) scale(1); }
`;

const underlineExpand = keyframes`
  from { width: 0; }
  to { width: 60px; }
`;

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName) => {
    navigate(`/auction-list?category=${encodeURIComponent(categoryName)}`);
  };

  const displayedCategories = showAll ? categories : categories.slice(0, 15);

  return (
    <Box>
      {/* HERO SECTION */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          color: '#ffffff',
          py: { xs: 6, md: 12 },
          px: { xs: 2, md: 4 },
          textAlign: 'center',
          background: 'linear-gradient(45deg, #ff6ec4, #7873f5, #24c6dc, #514a9d)',
          backgroundSize: '400% 400%',
          animation: `${gradientAnimation} 15s ease infinite`,
          zIndex: 0,
        }}
      >
        {/* Floating Orbs */}
        <Box
          sx={{
            position: 'absolute',
            borderRadius: '50%',
            opacity: 0.15,
            background: '#ffffff',
            width: 250,
            height: 250,
            top: -80,
            left: -80,
            zIndex: 1,
            animation: `${floatOrb1} 20s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            borderRadius: '50%',
            opacity: 0.15,
            background: '#ffffff',
            width: 350,
            height: 350,
            bottom: -100,
            right: -100,
            zIndex: 1,
            animation: `${floatOrb2} 25s ease-in-out infinite`,
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.8rem', md: '3rem' },
              fontWeight: 'bold',
              mb: 2,
              animation: `${textGlow} 3s ease-in-out infinite alternate`,
            }}
          >
            Discover Unique Auctions
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1rem', md: '1.5rem' },
              mb: 3,
              opacity: 0,
              animation: `${fadeInUp} 2s ease forwards`,
              animationDelay: '0.5s',
            }}
          >
            Explore a wide range of categories and find that perfect piece.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/auction-list')}
            sx={{
              backgroundColor: '#ffeb3b',
              color: '#283593',
              fontSize: '1.1rem',
              py: 1.5,
              px: 3,
              borderRadius: '30px',
              textTransform: 'none',
              transition: 'background-color 0.3s ease, transform 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#fdd835',
                transform: 'scale(1.05)',
              },
              // Ripple effect on active click
              '&:active::after': {
                content: '""',
                position: 'absolute',
                width: 100,
                height: 100,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: '50%',
                transform: 'scale(0)',
                animation: `${ripple} 0.6s linear`,
                top: '50%',
                left: '50%',
                pointerEvents: 'none',
              },
            }}
          >
            Start Exploring
          </Button>
        </Container>
      </Box>

      {/* CATEGORIES SECTION */}
      <Container
        maxWidth="lg"
        sx={{
          py: 6,
          px: { xs: 2, md: 4 },
          backgroundColor: '#ffffff',
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            mt: 5,
            mb: 2,
            fontWeight: 'bold',
            color: '#283593',
            fontSize: { xs: '1.5rem', md: '2rem' },
            position: 'relative',
            '&::after': {
              content: '""',
              width: 60,
              height: 4,
              background: '#283593',
              display: 'block',
              mx: 'auto',
              borderRadius: 2,
              mt: 1,
              animation: `${underlineExpand} 2s ease-out`,
            },
          }}
        >
          Browse Categories
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {displayedCategories.map((category) => {
            const IconComponent = icons[category.name] || icons['Uncategorized'];
            return (
              <Grid
                item
                key={category.id}
                xs={12}
                sm={6}
                md={4}
                lg={3}
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'translateY(-3px)' },
                }}
                onClick={() => handleCategoryClick(category.name)}
              >
                <Card
                  sx={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    p: { xs: 2, md: 3 },
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    // Shimmer effect on hover (using pseudo-element)
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      width: 0,
                      height: '100%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      transform: 'skewX(-20deg)',
                      transition: 'width 0.5s ease',
                      zIndex: 1,
                    },
                    '&:hover::before': {
                      width: '200%',
                    },
                    '&:hover': {
                      transform: 'translateY(-5px) scale(1.03)',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                    },
                    // Child selectors for icon and text hover effects
                    '&:hover .categoryIcon': { transform: 'scale(1.1)' },
                    '&:hover .categoryName': { color: '#1a237e' },
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <IconComponent
                      className="categoryIcon"
                      sx={{
                        fontSize: '50px',
                        color: '#3f51b5',
                        mb: 2,
                        transition: 'transform 0.3s ease',
                      }}
                    />
                    <Typography
                      variant="subtitle1"
                      className="categoryName"
                      sx={{
                        fontSize: '1.2rem',
                        fontWeight: 500,
                        color: '#283593',
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {category.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        <Box textAlign="center" mt={4}>
          <Button
            variant="contained"
            onClick={() => setShowAll(!showAll)}
            sx={{
              display: 'inline-block',
              mt: 4,
              px: 3,
              py: 1,
              borderRadius: '25px',
              backgroundColor: '#3f51b5',
              color: '#ffffff',
              fontSize: '1rem',
              textTransform: 'none',
              transition: 'background-color 0.3s ease, transform 0.3s ease',
              '&:hover': {
                backgroundColor: '#5c6bc0',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {showAll ? 'Show Less' : 'See All Categories'}
          </Button>
        </Box>
      </Container>

      {/* FOOTER */}
      <Box
        sx={{
          backgroundColor: '#283593',
          color: '#ffffff',
          textAlign: 'center',
          py: 2,
          mt: 6,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '50%',
            height: '2px',
            background: '#ffffff',
            top: 0,
            left: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '50%',
            height: '2px',
            background: '#ffffff',
            top: 0,
            right: 0,
          },
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body1" sx={{ position: 'relative', zIndex: 2, fontSize: '0.9rem' }}>
            &copy; {new Date().getFullYear()} Auction Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
