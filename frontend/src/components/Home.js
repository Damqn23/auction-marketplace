// src/components/Home.js

import React from 'react';
import { Link } from 'react-router-dom';
import {
    Button,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    Box,
    Stack,
} from '@mui/material';
import { EmojiEvents, AccountCircle, Gavel } from '@mui/icons-material'; // Example Icons

import styles from './Home.module.css'; // Importing the CSS Module

const Home = () => {
    // Example testimonials data
    const testimonials = [
        {
            id: 1,
            text: "Auction Marketplace made bidding effortless. I've won several items at great prices!",
            author: "Jane Doe",
        },
        {
            id: 2,
            text: "A reliable platform with a wide range of products. Highly recommended!",
            author: "John Smith",
        },
    ];

    return (
        <div className={styles.homeContainer}>
            {/* Hero Section */}
            <Box className={styles.hero}>
                <Container maxWidth="md">
                    <Typography variant="h3" component="h1" gutterBottom className={styles.heroTitle}>
                        Welcome to Auction Marketplace
                    </Typography>
                    <Typography variant="h6" component="p" gutterBottom className={styles.heroSubtitle}>
                        Discover unique items and participate in exciting auctions.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        component={Link}
                        to="/auction-list"
                        className={styles.heroButton}
                    >
                        Browse Auctions
                    </Button>
                </Container>
            </Box>

            {/* Features Section */}
            <Container className={styles.features} maxWidth="lg">
                <Typography variant="h4" component="h2" align="center" gutterBottom>
                    Why Choose Us
                </Typography>
                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} sm={6} md={4}>
                        <Card className={styles.featureCard}>
                            <EmojiEvents className={styles.icon} />
                            <Typography variant="h6" gutterBottom>
                                Trusted Platform
                            </Typography>
                            <Typography variant="body1">
                                We ensure a secure and reliable environment for all your auction needs.
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card className={styles.featureCard}>
                            <Gavel className={styles.icon} />
                            <Typography variant="h6" gutterBottom>
                                Wide Range of Items
                            </Typography>
                            <Typography variant="body1">
                                From antiques to modern gadgets, find a diverse selection of auction items.
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card className={styles.featureCard}>
                            <AccountCircle className={styles.icon} />
                            <Typography variant="h6" gutterBottom>
                                User-Friendly Interface
                            </Typography>
                            <Typography variant="body1">
                                Navigate our platform with ease, making your auction experience seamless.
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* How It Works Section */}
            <Box className={styles.howItWorks}>
                <Container maxWidth="md">
                    <Typography variant="h4" component="h2" align="center" gutterBottom>
                        How It Works
                    </Typography>
                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="h6" gutterBottom>
                                1. Register
                            </Typography>
                            <Typography variant="body1">
                                Create an account to start bidding and listing items.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="h6" gutterBottom>
                                2. Bid or Buy Now
                            </Typography>
                            <Typography variant="body1">
                                Participate in auctions by placing bids or purchase items instantly with Buy Now.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="h6" gutterBottom>
                                3. Win & Enjoy
                            </Typography>
                            <Typography variant="body1">
                                If you win the auction, the item is yours! Enjoy your purchase.
                            </Typography>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Testimonials Section */}
            <Container className={styles.testimonials} maxWidth="md">
                <Typography variant="h4" component="h2" align="center" gutterBottom>
                    What Our Users Say
                </Typography>
                <Grid container spacing={4}>
                    {testimonials.map((testimonial) => (
                        <Grid item xs={12} sm={6} key={testimonial.id}>
                            <Card className={styles.testimonialCard}>
                                <CardContent>
                                    <Typography variant="body1" gutterBottom>
                                        "{testimonial.text}"
                                    </Typography>
                                    <Typography variant="subtitle1" align="right">
                                        - {testimonial.author}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Footer */}
            <Box className={styles.footer}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        &copy; {new Date().getFullYear()} Auction Marketplace. All rights reserved.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Link to="/terms" className={styles.footerLink}>
                            <Typography variant="body2">Terms of Service</Typography>
                        </Link>
                        <Link to="/privacy" className={styles.footerLink}>
                            <Typography variant="body2">Privacy Policy</Typography>
                        </Link>
                        <Link to="/contact" className={styles.footerLink}>
                            <Typography variant="body2">Contact Us</Typography>
                        </Link>
                    </Stack>
                </Container>
            </Box>
        </div>
    );
};

export default Home;
