import React, { useContext, useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";
import { getUnreadMessages, getUserBalance } from "../services/auctionService";
import { getUnreadNotificationCount, markAllNotificationsRead, getAllNotifications } from "../services/notificationService";
import moment from "moment";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Box,
  TextField,
  Badge,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Fade,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ChatIcon from "@mui/icons-material/Chat";
import AccountCircle from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GavelIcon from "@mui/icons-material/Gavel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LogoutIcon from "@mui/icons-material/Logout";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { keyframes } from "@emotion/react";

// Add new animations
const slideIn = keyframes`
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const NavBar = ({ toggleColorMode, mode }) => {
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

  // Add new state for user menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  
  // Notification states
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

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

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const countResponse = await getUnreadNotificationCount();
          setNotificationCount(countResponse.unread_count);
          
          const notificationsResponse = await getAllNotifications();
          setNotifications(notificationsResponse.slice(0, 5)); // Show only recent 5
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };
      fetchNotifications();
    } else {
      setNotificationCount(0);
      setNotifications([]);
    }
  }, [user]);

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

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = async (event) => {
    setNotificationsAnchor(event.currentTarget);
    
    // Mark all notifications as read when menu opens
    if (notificationCount > 0) {
      try {
        await markAllNotificationsRead();
        setNotificationCount(0);
        // Update notifications to show as read
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({ ...notification, is_read: true }))
        );
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    }
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        background: mode === 'light' 
          ? "linear-gradient(45deg, #ff6ec4, #7873f5, #24c6dc, #514a9d)"
          : "linear-gradient(45deg, #2c3e50, #3498db, #2980b9, #1abc9c)",
        backgroundSize: "400% 400%",
        animation: `${gradientAnimation} 15s ease infinite`,
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
        backgroundColor: mode === 'light' 
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(18, 18, 18, 0.1)",
      }}
    >
      <Toolbar sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        minHeight: "64px !important",
        px: { xs: 2, md: 4 }
      }}>
        {/* Left Section */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {!isDesktop && (
            <>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{ 
                  mr: 1, 
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
              {user && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    mr: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: '0.9rem' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ffffff',
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    ${displayedBalance || '0.00'}
                  </Typography>
                </Box>
              )}
            </>
          )}
          <Typography
            variant="h6"
            component={NavLink}
            to="/"
            sx={{
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.5rem" },
              textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
              "&:hover": { 
                color: "#ffffff",
                textShadow: "2px 2px 8px rgba(255,255,255,0.5)",
              },
            }}
          >
            Auction Marketplace
          </Typography>
        </Box>

        {/* Middle: Search Bar */}
        <Box sx={{ 
          flex: 1, 
          maxWidth: "500px", 
          mx: 2,
          display: { xs: "none", md: "block" }
        }}>
          <TextField
            placeholder="Search items..."
            size="small"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            fullWidth
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
              ),
              endAdornment: (
                <IconButton 
                  onClick={handleSearchButtonClick} 
                  aria-label="search"
                  sx={{
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    }
                  }}
                >
                  <SearchIcon />
                </IconButton>
              ),
            }}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "25px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "transparent",
                },
                "&:hover fieldset": {
                  borderColor: "transparent",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "transparent",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "8px 14px",
              },
            }}
          />
        </Box>

        {/* Right Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isDesktop && user && (
            <>
              {/* Balance Display */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <AccountBalanceWalletIcon sx={{ color: '#ffffff' }} />
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  ${displayedBalance || '0.00'}
                </Typography>
              </Box>

              {/* Deposit Button */}
              <Tooltip title="Deposit Money" TransitionComponent={Fade}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/deposit")}
                  startIcon={<AccountBalanceWalletIcon />}
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    px: 2,
                    py: 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  Deposit
                </Button>
              </Tooltip>

              <Tooltip title="Create Auction" TransitionComponent={Fade}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/create")}
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    px: 2,
                    py: 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  Create Auction
                </Button>
              </Tooltip>

              <Tooltip title="Messages" TransitionComponent={Fade}>
                <IconButton
                  color="inherit"
                  onClick={() => navigate("/chat")}
                  sx={{
                    color: "#ffffff",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    }
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <ChatIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Notifications" TransitionComponent={Fade}>
                <IconButton
                  color="inherit"
                  onClick={handleNotificationsOpen}
                  sx={{
                    color: "#ffffff",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    }
                  }}
                >
                  <Badge badgeContent={notificationCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Account" TransitionComponent={Fade}>
                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{
                    color: "#ffffff",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "secondary.main",
                      "&:hover": {
                        animation: `${pulse} 1s ease-in-out`,
                      }
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </>
          )}

          {!user && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate("/login")}
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  "&:hover": {
                    borderColor: "#ffffff",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  }
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/register")}
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 200,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Balance: ${displayedBalance || '0.00'}
              </Typography>
            </Box>
          </Box>
        </Box>
        <MenuItem onClick={() => { navigate("/dashboard"); handleUserMenuClose(); }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Dashboard
        </MenuItem>
        <MenuItem onClick={() => { navigate("/my-bids"); handleUserMenuClose(); }}>
          <ListItemIcon>
            <GavelIcon fontSize="small" />
          </ListItemIcon>
          My Bids
        </MenuItem>
        <MenuItem onClick={() => { navigate("/my-auctions"); handleUserMenuClose(); }}>
          <ListItemIcon>
            <EmojiEventsIcon fontSize="small" />
          </ListItemIcon>
          My Auctions
        </MenuItem>
        <MenuItem onClick={() => { navigate("/my-purchases"); handleUserMenuClose(); }}>
          <ListItemIcon>
            <ShoppingBagIcon fontSize="small" />
          </ListItemIcon>
          My Purchases
        </MenuItem>
        <MenuItem onClick={() => { navigate("/favorites"); handleUserMenuClose(); }}>
          <ListItemIcon>
            <FavoriteIcon fontSize="small" />
          </ListItemIcon>
          Favorites
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleLogout(); handleUserMenuClose(); }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            minWidth: 300,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <MenuItem key={notification.id}>
              <ListItemText
                primary={notification.title}
                secondary={moment(notification.created_at).fromNow()}
                primaryTypographyProps={{
                  fontWeight: notification.is_read ? 'normal' : 'bold',
                }}
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <ListItemText
              primary="No notifications"
              secondary="You're all caught up!"
              sx={{ textAlign: "center" }}
            />
          </MenuItem>
        )}
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor={drawerAnchor}
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: "80%", sm: 300 },
            borderRadius: "0 12px 12px 0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Menu
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {drawerMenuItems.map((item, index) => (
              <ListItem
                key={index}
                button
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.link) {
                    navigate(item.link);
                  }
                  toggleDrawer(false)();
                }}
                sx={{
                  borderRadius: "8px",
                  mb: 1,
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  }
                }}
              >
                {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default NavBar;
