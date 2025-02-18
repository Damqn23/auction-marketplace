import React, { useEffect, useState } from "react";
import { getMyAuctions } from "../services/auctionService";
import { Link } from "react-router-dom";
import {
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Container,
  Box,
} from "@mui/material";
import { keyframes } from "@emotion/react";

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const MyAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyAuctions = async () => {
      try {
        const data = await getMyAuctions();
        if (Array.isArray(data)) {
          // Sort auctions by creation date (assumes each auction has a 'created_at' property)
          const sortedData = data.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setAuctions(sortedData);
        } else {
          setError("Unexpected data format received.");
        }
      } catch (err) {
        setError("Failed to load auctions.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyAuctions();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          textAlign: "center",
          color: "#555",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          Loading your auctions...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography
        variant="body1"
        color="error"
        sx={{ mt: 2, textAlign: "center" }}
      >
        {error}
      </Typography>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        p: 2,
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        animation: `${fadeIn} 1s ease-in-out`,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 2,
          fontWeight: "bold",
          color: "#333",
          textShadow: "1px 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        My Auctions
      </Typography>
      {auctions.length > 0 ? (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {auctions.map((auction) => (
            <Grid item xs={12} sm={6} md={4} key={auction.id}>
              <Card
                sx={{
                  background: "#fff",
                  borderRadius: "10px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  overflow: "hidden",
                  position: "relative",
                  "&:hover": {
                    transform: "translateY(-5px) scale(1.02)",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                {/* Image Section */}
                {auction.images && auction.images.length > 0 ? (
                  <CardMedia
                    component="img"
                    height="250"
                    image={auction.images[0].image}
                    alt={auction.title}
                    sx={{
                      transition: "transform 0.3s ease",
                      "&:hover": { transform: "scale(1.05)" },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: "250px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(135deg, #6a11cb, #2575fc)",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "1.25rem",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      No image available
                    </Typography>
                  </Box>
                )}

                <CardContent sx={{ p: 2, animation: `${slideUp} 0.5s ease-out` }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#333",
                      mb: 1,
                    }}
                  >
                    {auction.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 1, fontSize: "0.9rem" }}
                  >
                    {auction.description.length > 100
                      ? `${auction.description.substring(0, 100)}...`
                      : auction.description}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, fontSize: "0.9rem", color: "#555" }}
                  >
                    <strong>Starting Bid:</strong> ${auction.starting_bid}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, fontSize: "0.9rem", color: "#555" }}
                  >
                    <strong>Current Bid:</strong> ${auction.current_bid || "N/A"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      color: auction.status === "active" ? "primary.main" : "error.main",
                    }}
                  >
                    <strong>Status:</strong> {auction.status}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={Link}
                    to={`/auction/${auction.id}`}
                    sx={{
                      mt: 2,
                      textTransform: "none",
                      fontSize: "14px",
                      transition: "background-color 0.3s ease, transform 0.3s ease",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                        transform: "scale(1.02)",
                      },
                    }}
                  >
                    View Auction
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography
          variant="body1"
          sx={{ mt: 3, textAlign: "center", color: "#777" }}
        >
          You have not posted any auctions yet.
        </Typography>
      )}
    </Container>
  );
};

export default MyAuctions;
