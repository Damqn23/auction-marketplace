/**
 * Bidding Utilities
 * Centralized logic for bid calculations and validations
 */

/**
 * Calculate the minimum required bid for an auction item
 * @param {Object} auctionItem - The auction item object
 * @returns {string} - The minimum required bid amount as a string with 2 decimal places
 */
export const calculateMinBid = (auctionItem) => {
  if (!auctionItem) return "0.00";
  
  const currentBid = auctionItem.current_bid || auctionItem.starting_bid;
  const minBid = parseFloat(currentBid);
  
  if (isNaN(minBid)) return "0.00";
  
  // 2% increment
  const minIncrement = minBid * 0.02;
  const minRequiredBid = minBid + minIncrement;
  
  return minRequiredBid.toFixed(2);
};

/**
 * Check if a user can bid on an auction item
 * @param {Object} user - The current user object
 * @param {Object} auctionItem - The auction item object
 * @returns {boolean} - True if the user can bid
 */
export const canUserBid = (user, auctionItem) => {
  if (!user || !auctionItem || !auctionItem.owner) return false;
  
  return (
    user.username !== auctionItem.owner.username &&
    auctionItem.status === "active" &&
    !auctionItem.buy_now_buyer
  );
};

/**
 * Check if a user can use Buy Now on an auction item
 * @param {Object} user - The current user object
 * @param {Object} auctionItem - The auction item object
 * @returns {boolean} - True if the user can buy now
 */
export const canUserBuyNow = (user, auctionItem) => {
  if (!user || !auctionItem || !auctionItem.owner || !auctionItem.buy_now_price) return false;
  
  return (
    user.username !== auctionItem.owner.username &&
    auctionItem.status === "active" &&
    !auctionItem.buy_now_buyer
  );
};

/**
 * Validate a bid amount
 * @param {number|string} amount - The bid amount to validate
 * @param {number|string} minRequired - The minimum required bid
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateBidAmount = (amount, minRequired) => {
  const bidAmount = parseFloat(amount);
  const minBid = parseFloat(minRequired);
  
  if (isNaN(bidAmount)) {
    return { valid: false, error: 'invalidBid' };
  }
  
  if (bidAmount < minBid) {
    return { valid: false, error: 'bidTooLow', minRequired: minBid };
  }
  
  return { valid: true, error: null };
};

/**
 * Get the current bid display amount
 * @param {Object} auctionItem - The auction item object
 * @returns {string} - The current bid amount formatted with 2 decimals
 */
export const getCurrentBidAmount = (auctionItem) => {
  if (!auctionItem) return "0.00";
  
  const amount = auctionItem.current_bid || auctionItem.starting_bid;
  return parseFloat(amount).toFixed(2);
};

/**
 * Format currency amount
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted currency string (e.g., "$100.00")
 */
export const formatCurrency = (amount) => {
  const num = parseFloat(amount);
  return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
};

/**
 * Calculate bid increment percentage
 * @param {number|string} currentBid - Current bid amount
 * @param {number} percentage - Increment percentage (default: 2%)
 * @returns {string} - The increment amount with 2 decimal places
 */
export const calculateBidIncrement = (currentBid, percentage = 0.02) => {
  const bid = parseFloat(currentBid);
  if (isNaN(bid)) return "0.00";
  
  const increment = bid * percentage;
  return increment.toFixed(2);
};
