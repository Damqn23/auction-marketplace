import {
  calculateMinBid,
  canUserBid,
  canUserBuyNow,
  validateBidAmount,
  getCurrentBidAmount,
  formatCurrency,
  calculateBidIncrement,
} from '../biddingUtils';

describe('biddingUtils', () => {
  describe('calculateMinBid', () => {
    it('calculates 2% increment from current bid', () => {
      const item = { current_bid: '100.00', starting_bid: '50.00' };
      expect(calculateMinBid(item)).toBe('102.00');
    });

    it('uses starting bid when no current bid exists', () => {
      const item = { starting_bid: '50.00' };
      expect(calculateMinBid(item)).toBe('51.00');
    });

    it('handles decimal precision correctly', () => {
      const item = { current_bid: '99.99' };
      expect(calculateMinBid(item)).toBe('101.99');
    });

    it('returns "0.00" for null/undefined item', () => {
      expect(calculateMinBid(null)).toBe('0.00');
      expect(calculateMinBid(undefined)).toBe('0.00');
    });

    it('returns "0.00" for invalid bid values', () => {
      const item = { current_bid: 'invalid', starting_bid: 'invalid' };
      expect(calculateMinBid(item)).toBe('0.00');
    });
  });

  describe('canUserBid', () => {
    const mockUser = { username: 'buyer123' };
    const mockOwner = { username: 'seller456' };

    it('returns true when user can bid', () => {
      const item = {
        owner: mockOwner,
        status: 'active',
        buy_now_buyer: null,
      };
      expect(canUserBid(mockUser, item)).toBe(true);
    });

    it('returns false when user is the owner', () => {
      const item = {
        owner: { username: 'buyer123' },
        status: 'active',
        buy_now_buyer: null,
      };
      expect(canUserBid(mockUser, item)).toBe(false);
    });

    it('returns false when auction is not active', () => {
      const item = {
        owner: mockOwner,
        status: 'closed',
        buy_now_buyer: null,
      };
      expect(canUserBid(mockUser, item)).toBe(false);
    });

    it('returns false when item has buy_now_buyer', () => {
      const item = {
        owner: mockOwner,
        status: 'active',
        buy_now_buyer: { username: 'someone' },
      };
      expect(canUserBid(mockUser, item)).toBe(false);
    });

    it('returns false when user is null', () => {
      const item = { owner: mockOwner, status: 'active' };
      expect(canUserBid(null, item)).toBe(false);
    });

    it('returns false when item is null', () => {
      expect(canUserBid(mockUser, null)).toBe(false);
    });
  });

  describe('canUserBuyNow', () => {
    const mockUser = { username: 'buyer123' };
    const mockOwner = { username: 'seller456' };

    it('returns true when user can buy now', () => {
      const item = {
        owner: mockOwner,
        status: 'active',
        buy_now_price: '200.00',
        buy_now_buyer: null,
      };
      expect(canUserBuyNow(mockUser, item)).toBe(true);
    });

    it('returns false when no buy_now_price', () => {
      const item = {
        owner: mockOwner,
        status: 'active',
        buy_now_price: null,
        buy_now_buyer: null,
      };
      expect(canUserBuyNow(mockUser, item)).toBe(false);
    });

    it('returns false when user is the owner', () => {
      const item = {
        owner: { username: 'buyer123' },
        status: 'active',
        buy_now_price: '200.00',
        buy_now_buyer: null,
      };
      expect(canUserBuyNow(mockUser, item)).toBe(false);
    });

    it('returns false when already purchased', () => {
      const item = {
        owner: mockOwner,
        status: 'active',
        buy_now_price: '200.00',
        buy_now_buyer: { username: 'someone' },
      };
      expect(canUserBuyNow(mockUser, item)).toBe(false);
    });
  });

  describe('validateBidAmount', () => {
    it('validates correct bid amount', () => {
      const result = validateBidAmount('105.00', '102.00');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects bid below minimum', () => {
      const result = validateBidAmount('100.00', '102.00');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('bidTooLow');
      expect(result.minRequired).toBe(102.00);
    });

    it('rejects invalid bid amount', () => {
      const result = validateBidAmount('invalid', '102.00');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalidBid');
    });

    it('accepts bid equal to minimum', () => {
      const result = validateBidAmount('102.00', '102.00');
      expect(result.valid).toBe(true);
    });

    it('handles string and number inputs', () => {
      expect(validateBidAmount(105, 102).valid).toBe(true);
      expect(validateBidAmount('105', '102').valid).toBe(true);
    });
  });

  describe('getCurrentBidAmount', () => {
    it('returns current bid when available', () => {
      const item = { current_bid: '150.50', starting_bid: '100.00' };
      expect(getCurrentBidAmount(item)).toBe('150.50');
    });

    it('returns starting bid when no current bid', () => {
      const item = { starting_bid: '100.00' };
      expect(getCurrentBidAmount(item)).toBe('100.00');
    });

    it('formats to 2 decimal places', () => {
      const item = { current_bid: '150.5' };
      expect(getCurrentBidAmount(item)).toBe('150.50');
    });

    it('returns "0.00" for null item', () => {
      expect(getCurrentBidAmount(null)).toBe('0.00');
    });
  });

  describe('formatCurrency', () => {
    it('formats number correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(1000.5)).toBe('$1000.50');
    });

    it('formats string correctly', () => {
      expect(formatCurrency('100')).toBe('$100.00');
      expect(formatCurrency('99.99')).toBe('$99.99');
    });

    it('handles invalid input', () => {
      expect(formatCurrency('invalid')).toBe('$0.00');
      expect(formatCurrency(null)).toBe('$0.00');
    });

    it('rounds to 2 decimal places', () => {
      expect(formatCurrency(99.999)).toBe('$100.00');
      expect(formatCurrency(99.991)).toBe('$99.99');
    });
  });

  describe('calculateBidIncrement', () => {
    it('calculates default 2% increment', () => {
      expect(calculateBidIncrement('100.00')).toBe('2.00');
      expect(calculateBidIncrement('50.00')).toBe('1.00');
    });

    it('calculates custom percentage increment', () => {
      expect(calculateBidIncrement('100.00', 0.05)).toBe('5.00');
      expect(calculateBidIncrement('100.00', 0.10)).toBe('10.00');
    });

    it('handles invalid input', () => {
      expect(calculateBidIncrement('invalid')).toBe('0.00');
      expect(calculateBidIncrement(null)).toBe('0.00');
    });

    it('formats to 2 decimal places', () => {
      expect(calculateBidIncrement('99.99', 0.02)).toBe('2.00');
    });
  });
});
