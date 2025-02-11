// frontend/src/components/NavBar.js

import React, { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import { useThemeContext } from "../contexts/ThemeContext";
import Brightness4Icon from "@mui/icons-material/Brightness4"; // Dark mode icon
import Brightness7Icon from "@mui/icons-material/Brightness7"; // Light mode icon
import { getUnreadMessages } from "../services/auctionService";
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
  const { mode, toggleTheme } = useThemeContext();

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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setUnreadCount(0);
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      navigate(`/auction-list?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchButtonClick = () => {
    if (searchQuery.trim() !== "") {
      navigate(`/auction-list?q=${encodeURIComponent(searchQuery)}`);
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
        {
          text: "Chat",
          link: "/chat",
          icon: <ChatIcon />,
          badge: unreadCount > 0 ? unreadCount : null,
        },
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

        {/* Center Section: Only Search Bar (dropdown removed) */}
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
        </Box>

        {/* Right Section (Desktop Only) */}
        {isDesktop && user && (
          <Box className={styles.primaryActions}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate("/create")}
            >
              Create Auction
            </Button>

            <IconButton color="inherit" onClick={() => navigate("/chat")}>
              <Badge
                badgeContent={unreadCount > 9 ? "9+" : unreadCount}
                color="error"
              >
                <ChatIcon />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>

            <IconButton color="inherit" onClick={toggleDrawer(true)}>
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
      <Drawer
        anchor={drawerAnchor}
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
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
