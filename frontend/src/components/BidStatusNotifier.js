// src/components/BidStatusNotifier.js
import React, { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNotification } from "../contexts/NotificationContext";
import { getMyBidAuctions } from "../services/auctionService";

const BidStatusNotifier = () => {
  const { notify } = useNotification();
  const previousAuctionsRef = useRef([]);

  // Poll every 5 seconds
  const { data: bidAuctions } = useQuery({
    queryKey: ["bidAuctions"],
    queryFn: getMyBidAuctions,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!bidAuctions) return;

    // For each auction in the latest data
    bidAuctions.forEach((auction) => {
      // find the previous version of the same auction
      const previous = previousAuctionsRef.current.find((prevA) => prevA.id === auction.id);

      // If previously winning but now not winning => outbid
      if (previous && previous.is_winning && !auction.is_winning) {
        notify(
          `You have been outbid on "${auction.title}". New bid: $${auction.current_bid}`,
          "warning"
        );
      }
    });

    // Update the ref for the next poll
    previousAuctionsRef.current = bidAuctions;
  }, [bidAuctions, notify]);

  return null;
};

export default BidStatusNotifier;
