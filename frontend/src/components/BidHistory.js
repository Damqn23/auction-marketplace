import React, { useState, useEffect, useContext } from "react";
import { getUserBids } from "../services/bidService";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import moment from "moment";
import { useTranslation } from 'react-i18next';
import {
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Box,
} from "@mui/material";

const BidHistory = () => {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchBids();
    } else {
      setLoading(false);
      setBids([]);
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchBids = async () => {
    try {
      const response = await getUserBids();
      // Sort bids by timestamp (newest first)
      const sortedBids = response.data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setBids(sortedBids);
      setLoading(false);
    } catch (err) {
      setError("Failed to load bid history.");
      toast.error("Failed to load bid history.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          p: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body1" color="error" sx={{ textAlign: "center", mt: 2 }}>
        {error}
      </Typography>
    );
  }

  if (bids.length === 0) {
    return (
      <Typography variant="body1" sx={{ textAlign: "center", mt: 2, color: "grey.600" }}>
        No bids placed yet.
      </Typography>
    );
  }

  // Group bids by day (formatted as "MMMM Do YYYY")
  const groupedBids = bids.reduce((groups, bid) => {
    const date = moment(bid.timestamp).format("MMMM Do YYYY");
    if (!groups[date]) groups[date] = [];
    groups[date].push(bid);
    return groups;
  }, {});

  // Sort dates (newest day first)
  const sortedDates = Object.keys(groupedBids).sort((a, b) =>
    moment(b, "MMMM Do YYYY").diff(moment(a, "MMMM Do YYYY"))
  );

  return (
    <Box
      sx={{
        maxWidth: "800px",
        mx: "auto",
        p: 3,
        backgroundColor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" sx={{ mb: 3, textAlign: "center" }}>
        My Bids
      </Typography>
      {sortedDates.map((date) => (
        <Box key={date} sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              color: "primary.main",
              borderBottom: "2px solid",
              borderColor: "primary.main",
              pb: 0.5,
            }}
          >
            {date}
          </Typography>
          {groupedBids[date].map((bid) => (
            <Card
              key={bid.id}
              sx={{
                mb: 2,
                borderRadius: 2,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                border: "1px solid",
                borderColor: "grey.300",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: 3,
                },
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  <strong>Bid on:</strong> {bid.auction_item}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Amount:</strong> ${bid.amount}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong>{" "}
                  {moment(bid.timestamp).format("h:mm:ss a")}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default BidHistory;
