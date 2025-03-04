import React, { useContext, useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import { getUnreadMessages, getUserBalance } from "../services/auctionService";
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

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const NavBar = () => {
  const { user, setUser, unreadCount, setUnreadCount } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // Balance states
  const [balance, setBalance] = useState(null); // actual balance from backend
  const [displayedBalance, setDisplayedBalance] = useState(null); // animated display value
  const prevBalanceRef = useRef(null); // to store the previous balance value

  // Fetch unread messages on login
  useEffect(() => {
    if (user) {
      getUnreadMessages()
        .then((response) => setUnreadCount(response.unread_count))
        .catch((error) =>
          console.error("Error fetching unread messages:", error)
        );
    }
  }, [user, setUnreadCount]);

  // Initial fetch of user balance when logged in
  useEffect(() => {
    if (user) {
      getUserBalance()
        .then((data) => {
          const bal = parseFloat(data.balance);
          setBalance(bal);
          setDisplayedBalance(bal.toFixed(2));
          prevBalanceRef.current = bal;
        })
        .catch((err) => console.error("Error fetching user balance:", err));
    }
  }, [user]);

  // Poll unread messages (if needed)
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

  // Animation function to update the displayed balance
  const animateBalanceChange = (newBalance) => {
    const start = prevBalanceRef.current !== null ? prevBalanceRef.current : newBalance;
    const end = newBalance;
    const duration = 1000; // animation duration in ms
    const intervalTime = 50; // update every 50ms
    const steps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps) {
        const progress = currentStep / steps;
        // Linear interpolation between start and end
        const interpolated = start + (end - start) * progress;
        // Add a bit of random noise (10% of the difference) for a "spinning" effect
        const noise = (Math.random() - 0.5) * Math.abs(end - start) * 0.1;
        setDisplayedBalance((interpolated + noise).toFixed(2));
      } else {
        setDisplayedBalance(end.toFixed(2));
        clearInterval(interval);
      }
    }, intervalTime);
    prevBalanceRef.current = newBalance;
  };

  // WebSocket connection for balance updates using your existing setup
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("access_token");
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${protocol}://${process.env.REACT_APP_WEBSOCKET_URL}/ws/balance/?token=${token}`;
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.balance) {
          const newBal = parseFloat(data.balance);
          setBalance(newBal);
          animateBalanceChange(newBal);
        }
      };
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      return () => ws.close();
    }
  }, [user]);

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
        { text: "Dashboard", link: "/dashboard" },
        { text: "Logout", action: handleLogout },
      ]
    : [
        { text: "Login", link: "/login" },
        { text: "Register", link: "/register" },
      ];

  const mobileMenuItems = user ? [...primaryActions, ...secondaryActions] : secondaryActions;
  const drawerMenuItems = isDesktop && user ? secondaryActions : mobileMenuItems;
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
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Left Section */}
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

        {/* Middle: Search Bar */}
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

        {/* Right Section (Desktop) */}
        {isDesktop && user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {displayedBalance !== null && (
              <Typography variant="body1" sx={{ color: "#fff" }}>
                Balance: ${displayedBalance}
              </Typography>
            )}
            <Button variant="contained" color="warning" onClick={() => navigate("/deposit")}>
              Deposit
            </Button>
            <Button variant="contained" color="secondary" onClick={() => navigate("/create")}>
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

        {isDesktop && !user && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton color="inherit" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>

      {/* Drawer for mobile or secondary actions */}
      <Drawer anchor={drawerAnchor} open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)} sx={{ width: 250 }}>
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
