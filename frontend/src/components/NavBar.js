import React, { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import { getUnreadMessages } from "../services/auctionService";
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
import { keyframes } from "@emotion/react";

// Define the animated gradient keyframes
const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const NavBar = () => {
  const { user, setUser, unreadCount, setUnreadCount } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Define action groups for the drawer
  const primaryActions = user
    ? [
        { text: "Create Auction", link: "/create" },
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
        { text: "Favorites", link: "/favorites" },
        { text: "Logout", action: handleLogout },
      ]
    : [
        { text: "Login", link: "/login" },
        { text: "Register", link: "/register" },
      ];

  // For mobile view, combine primary and secondary actions.
  const mobileMenuItems = user ? [...primaryActions, ...secondaryActions] : secondaryActions;
  // For desktop logged-in users, show only secondary actions in the drawer.
  const drawerMenuItems = isDesktop && user ? secondaryActions : mobileMenuItems;
  // Set drawer anchor: right for desktop logged-in users, left otherwise.
  const drawerAnchor = user && isDesktop ? "right" : "left";

  return (
    <AppBar
      position="static"
      sx={{
        background: "linear-gradient(45deg, #ff6ec4, #7873f5, #24c6dc, #514a9d)",
        backgroundSize: "400% 400%",
        animation: `${gradientAnimation} 15s ease infinite`,
        padding: "10px 20px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left Section: Logo and (for mobile) hamburger menu */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {!isDesktop && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 1, color: "#ffffff" }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component={NavLink}
            to="/"
            sx={{
              color: "#ffeb3b",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.5rem",
              "&:hover": { color: "#ffe082" },
            }}
          >
            Auction Marketplace
          </Typography>
        </Box>

        {/* Center Section: Search Bar */}
        <Box sx={{ flex: 1, maxWidth: "500px", mx: 2 }}>
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
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "4px",
            }}
          />
        </Box>

        {/* Right Section: Desktop Primary Actions */}
        {isDesktop && user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate("/create")}
              sx={{ textTransform: "none" }}
            >
              Create Auction
            </Button>
            <IconButton color="inherit" onClick={() => navigate("/chat")}>
              <Badge badgeContent={unreadCount > 9 ? "9+" : unreadCount} color="error">
                <ChatIcon />
              </Badge>
            </IconButton>
            <IconButton color="inherit" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        {/* Right Section: For Desktop when not logged in */}
        {isDesktop && !user && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton color="inherit" onClick={toggleDrawer(true)}>
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
          sx={{ width: 250 }}
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
                    <Box
                      sx={{
                        backgroundColor: "#e53935",
                        color: "white",
                        borderRadius: "50%",
                        px: "6px",
                        py: "2px",
                        fontSize: "0.75rem",
                        ml: 1,
                      }}
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </Box>
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
