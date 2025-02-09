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
import { icons } from './CategoryIcons';
import styles from './Home.module.css';

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
    <div>
      {/* HERO SECTION */}
      <Box className={styles.hero}>
        <Container maxWidth="md">
          <Typography variant="h2" className={styles.heroTitle}>
            Discover Unique Auctions
          </Typography>
          <Typography variant="h5" className={styles.heroSubtitle}>
            Explore a wide range of categories and find that perfect piece.
          </Typography>
          <Button
            variant="contained"
            className={styles.heroButton}
            onClick={() => navigate('/auction-list')}
          >
            Start Exploring
          </Button>
        </Container>
      </Box>

      {/* CATEGORIES SECTION */}
      <Container maxWidth="lg" className={styles.homeContainer}>
        <Typography variant="h4" align="center" gutterBottom className={styles.sectionTitle}>
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
                className={styles.categoryGridItem}
                onClick={() => handleCategoryClick(category.name)}
              >
                <Card className={styles.categoryCard}>
                  <CardContent className={styles.categoryContent}>
                    <IconComponent className={styles.categoryIcon} />
                    <Typography variant="subtitle1" className={styles.categoryName}>
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
            color="primary"
            onClick={() => setShowAll(!showAll)}
            className={styles.toggleButton}
          >
            {showAll ? 'Show Less' : 'See All Categories'}
          </Button>
        </Box>
      </Container>

      {/* FOOTER */}
      <Box className={styles.footer}>
        <Container maxWidth="lg">
          <Typography variant="body1">
            &copy; {new Date().getFullYear()} Auction Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </div>
  );
};

export default Home;
