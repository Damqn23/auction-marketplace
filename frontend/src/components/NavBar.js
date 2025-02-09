import React, { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import { getUnreadMessages } from "../services/auctionService";
import { getAllCategories } from "../services/categoryService";
import styles from "./NavBar.module.css";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  TextField,
  Badge,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ChatIcon from "@mui/icons-material/Chat";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const NavBar = () => {
  const { user, setUser, unreadCount, setUnreadCount } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // Fetch unread messages when user is logged in
  useEffect(() => {
    if (user) {
      const fetchUnreadMessages = async () => {
        try {
          const response = await getUnreadMessages();
          setUnreadCount(response.unread_count);
        } catch (error) {
          console.error("Error fetching unread message count", error);
        }
      };
      fetchUnreadMessages();
    }
  }, [user, setUnreadCount]);

  // Fetch categories for the select dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryData = await getAllCategories();
        setCategories(categoryData);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setUnreadCount(0);
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const handleSearch = (e) => {
    if (
      e.key === "Enter" &&
      (searchQuery.trim() !== "" || selectedCategory)
    ) {
      navigate(
        `/auction-list?q=${encodeURIComponent(
          searchQuery
        )}&category=${encodeURIComponent(selectedCategory)}`
      );
    }
  };

  const handleSearchButtonClick = () => {
    if (searchQuery.trim() !== "" || selectedCategory) {
      navigate(
        `/auction-list?q=${encodeURIComponent(
          searchQuery
        )}&category=${encodeURIComponent(selectedCategory)}`
      );
    }
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  /** 
   * Define action groups:
   * - For logged-in users on desktop, show primary actions (Create Auction and Chat) inline.
   * - The remaining (secondary) actions will be available in the drop‑down.
   * - For mobile (or non‑logged‑in desktop), show all actions in the drawer.
   */
  const primaryActions = user
    ? [
        { text: "Create Auction", link: "/create", type: "button" },
        { text: "Chat", link: "/chat", icon: <ChatIcon />, badge: unreadCount > 0 ? unreadCount : null },
      ]
    : [];

  const secondaryActions = user
    ? [
        { text: "My Bids", link: "/my-bids" },
        { text: "My Purchases", link: "/my-purchases" },
        { text: "My Auctions", link: "/my-auctions" },
        { text: "Logout", action: handleLogout },
      ]
    : [
        { text: "Login", link: "/login" },
        { text: "Register", link: "/register" },
      ];

  // For mobile view, combine primary and secondary actions.
  const mobileMenuItems = user ? [...primaryActions, ...secondaryActions] : secondaryActions;

  // For desktop logged-in users, show only secondary actions in the drop‑down.
  const drawerMenuItems = isDesktop && user ? secondaryActions : mobileMenuItems;

  // Set drawer anchor: right for desktop logged-in users, left otherwise.
  const drawerAnchor = user && isDesktop ? "right" : "left";

  return (
    <AppBar position="static" className={styles.navbar}>
      <Toolbar className={styles.toolbar}>
        {/* Left Section: Logo and (for mobile) hamburger menu */}
        <Box className={styles.leftSection}>
          {!isDesktop && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              className={styles.menuIcon}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component={NavLink}
            to="/"
            className={styles.logo}
          >
            Auction Marketplace
          </Typography>
        </Box>

        {/* Center Section: Search Bar and Category Select */}
        <Box className={styles.searchContainer}>
          <TextField
            placeholder="Search items..."
            size="small"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            fullWidth
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSearchButtonClick} aria-label="search">
                  <SearchIcon />
                </IconButton>
              ),
            }}
          />
          <TextField
            select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            variant="outlined"
            size="small"
            style={{ marginTop: "10px" }}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </TextField>
        </Box>

        {/* Right Section (Desktop Only) */}
        {isDesktop && user && (
          <Box className={styles.primaryActions}>
            {/* Create Auction as a prominent button */}
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate("/create")}
              className={styles.createAuctionButton}
            >
              Create Auction
            </Button>
            {/* Chat icon with badge */}
            <IconButton
              color="inherit"
              onClick={() => navigate("/chat")}
              className={styles.chatIconButton}
            >
              <Badge badgeContent={unreadCount > 9 ? "9+" : unreadCount} color="error">
                <ChatIcon />
              </Badge>
            </IconButton>
            {/* Burger menu for secondary actions */}
            <IconButton
              color="inherit"
              onClick={toggleDrawer(true)}
              className={styles.secondaryMenuButton}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        {/* For Desktop when not logged in, show a burger icon on the right */}
        {isDesktop && !user && (
          <Box className={styles.primaryActions}>
            <IconButton
              color="inherit"
              onClick={toggleDrawer(true)}
              className={styles.secondaryMenuButton}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>

      {/* Drawer for Navigation */}
      <Drawer anchor={drawerAnchor} open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
          className={styles.drawer}
        >
          <List>
            {drawerMenuItems.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem
                  button
                  component={item.link ? NavLink : "div"}
                  to={item.link || undefined}
                  onClick={item.action || undefined}
                >
                  <ListItemText primary={item.text} />
                  {item.badge && (
                    <span className={styles.notificationBadge}>
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </ListItem>
                {index < drawerMenuItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default NavBar;
