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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";

const NavBar = () => {
  const { user, setUser, unreadCount, setUnreadCount } =
    useContext(UserContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await getUnreadMessages();
        setUnreadCount(response.unread_count);
      } catch (error) {
        console.error("Error fetching unread message count", error);
      }
    };

    if (user) {
      fetchUnreadMessages();
    }
  }, [user, setUnreadCount]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setUnreadCount(0); // Reset unread count on logout
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && (searchQuery.trim() !== '' || selectedCategory)) {
        navigate(`/auction-list?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`);
    }
};

const handleSearchButtonClick = () => {
    if (searchQuery.trim() !== '' || selectedCategory) {
        navigate(`/auction-list?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`);
    }
};

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

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

  const menuItems = user
    ? [
        { text: "Create Auction", link: "/create" },
        { text: "My Bids", link: "/my-bids" },
        { text: "My Purchases", link: "/my-purchases" },
        { text: "My Auctions", link: "/my-auctions" },
        {
          text: "Chat",
          link: "/chat",
          badge: unreadCount > 0 ? unreadCount : null,
        },
        { text: "Logout", action: handleLogout },
      ]
    : [
        { text: "Login", link: "/login" },
        { text: "Register", link: "/register" },
      ];

  return (
    <AppBar position="static" className={styles.navbar}>
      <Toolbar>
        {/* Hamburger Menu Icon */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleDrawer(true)}
          className={styles.menuIcon}
        >
          <MenuIcon />
        </IconButton>

        {/* Brand / Logo */}
        <Typography
          variant="h6"
          component={NavLink}
          to="/"
          className={styles.logo}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          Auction Marketplace
        </Typography>

        {/* Search Bar */}
        <Box className={styles.searchBar}>
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
                <IconButton
                  onClick={handleSearchButtonClick}
                  aria-label="search"
                >
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

        {/* Drawer for Navigation Links */}
        <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
          <Box
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
          >
            <List>
              {menuItems.map((item, index) => (
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
                  {index < menuItems.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
