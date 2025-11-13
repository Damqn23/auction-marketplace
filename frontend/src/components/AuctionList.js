import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  TextField,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Skeleton,
  Fade,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { keyframes } from "@emotion/react";

import { getAllAuctionItems, placeBid, buyNow, searchAuctionItems } from "../services/auctionService";
import { getAllCategories } from "../services/categoryService";
import { UserContext } from "../contexts/UserContext";
import { useTranslation } from 'react-i18next';

import CountdownTimer from "./CountdownTimer";
import BuyNowModal from "./BuyNowModal";
import FavoriteButton from "./FavoriteButton";
import QuickPreviewModal from './QuickPreviewModal';

// Add animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const AuctionList = () => {
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ----- URL search params and filters -----
  const locationHook = useLocation();
  const queryParams = new URLSearchParams(locationHook.search);
  const query = queryParams.get("q") || "";
  const categoryFromUrl = queryParams.get("category") || "";

  const initialFilterValues = {
    min_price: "",
    max_price: "",
    condition: "",
    location: "",
    category: categoryFromUrl,
  };
  const [pendingFilters, setPendingFilters] = useState(initialFilterValues);
  const [appliedFilters, setAppliedFilters] = useState(initialFilterValues);

  // ----- Sort & Filter UI state -----
  const [sortBy, setSortBy] = useState("newest");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // ----- Data fetching -----
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
  });

  const { data: auctionItems, isLoading, isError, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["auctionItems", query, appliedFilters, sortBy],
    queryFn: ({ pageParam = 1 }) => {
      // If user typed something, do fuzzy search:
      if (query) {
        return searchAuctionItems(query, appliedFilters.category);
      } else {
        // No query? Then just do the normal listing
        const params = { ...appliedFilters, sort_by: sortBy, page: pageParam };
        return getAllAuctionItems(params);
      }
    },
    refetchInterval: 5000,
    onError: () => t("auction.toasts.loadFailed"),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      
      const { current_page, per_page, total } = lastPage.meta;
      const totalPages = Math.ceil(total / per_page);
      
      if (current_page < totalPages) {
        return current_page + 1;
      }
      return undefined;
    },
  });

  // ----- Bulgarian cities (for Location filter) -----
  const [cities, setCities] = useState([]);
  useEffect(() => {
    fetch("/data/bg.json")
      .then((res) => res.json())
      .then((data) => {
        const sortedCities = data.sort((a, b) => a.city.localeCompare(b.city));
        setCities(sortedCities);
      })
      .catch((error) => console.error("Error fetching cities:", error));
  }, []);

  // ----- Bidding & Buy Now mutations -----
  const [bidAmounts, setBidAmounts] = useState({});

  const bidMutation = useMutation({
    mutationFn: placeBid,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success(t("auction.toasts.bidPlaced"));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || t("auction.toasts.bidFailed"));
    },
  });

  const handlePlaceBid = (auctionId) => {
    const amount = parseFloat(bidAmounts[auctionId]);
    if (isNaN(amount)) {
      toast.error(t("auction.toasts.invalidBid"));
      return;
    }
    bidMutation.mutate({ id: auctionId, amount });
  };

  const buyNowMutation = useMutation({
    mutationFn: buyNow,
    onSuccess: () => {
      queryClient.invalidateQueries(["auctionItems"]);
      toast.success(t("auction.toasts.purchaseSuccess"));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || t("auction.toasts.purchaseFailed"));
    },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openBuyNowModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const closeBuyNowModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };
  const handleConfirmBuyNow = () => {
    if (!selectedItem) return;
    buyNowMutation.mutate(selectedItem.id);
    closeBuyNowModal();
  };

  // ----- Filter Handlers -----
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget);
  const handleFilterClose = () => setFilterAnchorEl(null);
  const handleFilterChange = (e) => {
    setPendingFilters({ ...pendingFilters, [e.target.name]: e.target.value });
  };
  const handleSortChange = (e) => setSortBy(e.target.value);
  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    handleFilterClose();
    queryClient.invalidateQueries(["auctionItems"]);
  };

  // Infinite scroll setup
  const observer = useRef();
  const lastAuctionRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasNextPage, fetchNextPage]);

  // Skeleton loading component
  const LoadingSkeleton = () => (
    <Grid container spacing={2}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Card sx={{ height: '100%', animation: `${fadeIn} 0.5s ease-out` }}>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" height={32} />
              <Skeleton variant="text" width="60%" />
              <Box sx={{ mt: 1 }}>
                <Skeleton variant="text" width="40%" />
              </Box>
            </CardContent>
            <CardActions>
              <Skeleton variant="rectangular" width={100} height={36} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Empty state component
  const EmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center',
      }}
    >
      <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        No auctions found
      </Typography>
      <Typography color="text.secondary" paragraph>
        Try adjusting your filters or search terms
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          setAppliedFilters(initialFilterValues);
          setSortBy('newest');
        }}
      >
        Reset Filters
      </Button>
    </Box>
  );

  // Mobile gesture controls
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && !filterAnchorEl) {
      handleFilterClick();
    } else if (isRightSwipe && filterAnchorEl) {
      handleFilterClose();
    }
  };

  const [previewItem, setPreviewItem] = useState(null);

  const handleItemClick = (item) => {
    setPreviewItem(item);
  };

  const handleClosePreview = () => {
    setPreviewItem(null);
  };

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        mt: { xs: '64px', sm: '72px' },
        pt: { xs: 2, sm: 3 },
        minHeight: '100vh',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #f0f4f8 0%, #f7f9fc 100%)'
          : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar (Filters + Sort) */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: "space-between",
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={t("filters.filters")}>
            <IconButton
              onClick={handleFilterClick}
              sx={{
                backgroundColor: "primary.main",
                color: "#fff",
                "&:hover": { 
                  backgroundColor: "primary.dark",
                  transform: "scale(1.05)",
                },
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {query ? t("auctionList.searchResultsFor", { query }) : t("auctionList.allAuctions")}
          </Typography>
        </Box>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('filters.sortBy')}</InputLabel>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            label={t("filters.sortBy")} startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            <MenuItem value="newest">{t('filters.sort.newest')}</MenuItem>
            <MenuItem value="ending_soon">{t('filters.sort.endingSoon')}</MenuItem>
            <MenuItem value="highest_bid">{t('filters.sort.highestBid')}</MenuItem>
            <MenuItem value="lowest_price">{t('filters.sort.lowestPrice')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Auction Items Grid */}
      {auctionItems?.pages?.length > 0 ? (
        <Grid container spacing={2}>
          {auctionItems.pages.map((page, pageIndex) => (
            <React.Fragment key={pageIndex}>
              {page.items?.map((item, index) => {
                const isNotOwner = user && item.owner && user.username !== item.owner.username;
                const canBid = isNotOwner && item.status === "active" && !item.buy_now_buyer;
                const canBuyNow = isNotOwner && item.status === "active" && item.buy_now_price && !item.buy_now_buyer;
                const minBid = item.current_bid ? parseFloat(item.current_bid) : parseFloat(item.starting_bid);
                const minIncrement = minBid * 0.02;
                const minRequiredBid = (minBid + minIncrement).toFixed(2);
                const isLastElement = pageIndex === auctionItems.pages.length - 1 && index === page.items.length - 1;

                return (
                  <Grid 
                    item 
                    xs={12} 
                    sm={6} 
                    md={4} 
                    key={item.id}
                    ref={isLastElement ? lastAuctionRef : null}
                  >
                    <Fade in timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          },
                        }}
                        onClick={() => handleItemClick(item)}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={item.images?.[0]?.image || '/placeholder.jpg'}
                          alt={item.title}
                          sx={{
                            objectFit: 'cover',
                            cursor: 'pointer',
                            '&:hover': {
                              animation: `${pulse} 1s ease-in-out`,
                            },
                          }}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="h6" component="h2" noWrap>
                              {item.title}
                            </Typography>
                            <FavoriteButton auctionId={item.id} />
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {item.description?.substring(0, 100)}...
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                              label={item.status}
                              color={item.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                            {item.buy_now_price && (
                              <Chip
                                label="Buy Now Available"
                                color="primary"
                                size="small"
                              />
                            )}
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ p: 2, pt: 1 }}>
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                {t('auction.currentBid')}
                              </Typography>
                              <Typography variant="h6" color="primary">
                                ${item.current_bid || item.starting_bid}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {canBid && (
                                <TextField
                                  size="small"
                                  type="number"
                                  placeholder={`Min: $${minRequiredBid}`}
                                  value={bidAmounts[item.id] || ''}
                                  onChange={(e) => setBidAmounts({ ...bidAmounts, [item.id]: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  sx={{ flex: 1 }}
                                />
                              )}
                              {canBid && (
                                <Button
                                  variant="contained"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlaceBid(item.id);
                                  }}
                                  disabled={bidMutation.isLoading}
                                >
                                  {t('auction.bid')}
                                </Button>
                              )}
                              {canBuyNow && (
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openBuyNowModal(item);
                                  }}
                                >
                                  {t('auction.buyNow')}
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </CardActions>
                      </Card>
                    </Fade>
                  </Grid>
                );
              })}
            </React.Fragment>
          ))}
        </Grid>
      ) : (
        <EmptyState />
      )}

      {/* Loading indicator */}
      {isLoading && <LoadingSkeleton />}
      {hasNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 300,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={pendingFilters.category}
                  onChange={handleFilterChange}
                  label={t("filters.category")}>
                  <MenuItem value="">All Categories</MenuItem>
                  {categoriesData?.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label={t("filters.minPrice")} name="min_price"
                type="number"
                value={pendingFilters.min_price}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label={t("filters.maxPrice")} name="max_price"
                type="number"
                value={pendingFilters.max_price}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Condition</InputLabel>
                <Select
                  name="condition"
                  value={pendingFilters.condition}
                  onChange={handleFilterChange}
                  label={t("filters.condition")}>
                  <MenuItem value="">All Conditions</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="like_new">Like New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  name="location"
                  value={pendingFilters.location}
                  onChange={handleFilterChange}
                  label={t("filters.location")}>
                  <MenuItem value="">All Locations</MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city.id} value={city.city}>
                      {city.city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setPendingFilters(initialFilterValues);
              handleFilterClose();
            }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            onClick={applyFilters}
            fullWidth
          >
            Apply Filters
          </Button>
        </Box>
      </Menu>

      {/* Buy Now Modal */}
      <BuyNowModal
        open={modalOpen}
        onClose={closeBuyNowModal}
        onConfirm={handleConfirmBuyNow}
        item={selectedItem}
      />

      {/* Quick Preview Modal */}
      <QuickPreviewModal
        open={Boolean(previewItem)}
        onClose={handleClosePreview}
        item={previewItem}
      />
    </Box>
  );
};

export default AuctionList;
