import React, { useContext, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNotification } from "../contexts/NotificationContext";
import { getMyBidAuctions } from "../services/auctionService";
import { UserContext } from "../contexts/UserContext";

const BidStatusNotifier = () => {
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const previousAuctionsRef = useRef([]);

  // Check if we actually have a valid user & token
  const token = localStorage.getItem("access_token");
  const isLoggedIn = !!(user && token);

  // 1) Always call the hook (no early return). Use `enabled` to skip if not logged in.
  const { data: bidAuctions } = useQuery({
    queryKey: ["bidAuctions"],
    queryFn: getMyBidAuctions,
    refetchInterval: 5000,
    enabled: isLoggedIn, // Only do requests if logged in
  });

  // 2) Condition the effect logic inside the effect itself
  useEffect(() => {
    // If not logged in or there's no data, do nothing
    if (!isLoggedIn || !bidAuctions) return;

    // For each auction in the new data
    bidAuctions.forEach((auction) => {
      // Look for a previous version of the same auction
      const prev = previousAuctionsRef.current.find((p) => p.id === auction.id);

      // If previously winning but now not winning => outbid
      if (prev && prev.is_winning && !auction.is_winning) {
        notify(
          `You have been outbid on "${auction.title}". New bid: $${auction.current_bid}`,
          "warning"
        );
      }
    });

    // Update our "previous" auctions for next poll
    previousAuctionsRef.current = bidAuctions;
  }, [isLoggedIn, bidAuctions, notify]);

  // This component doesn't render anything visible
  return null;
};

export default BidStatusNotifier;
