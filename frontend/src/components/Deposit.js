import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axiosInstance from '../services/axiosConfig';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert,
  Container,
  Grid,
  useTheme,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      color: "#424770",
      fontSize: "16px",
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

function DepositForm() {
  const stripe = useStripe();
  const elements = useElements();
  const theme = useTheme();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post('/create-deposit-payment-intent/', { amount });
      const { client_secret } = response.data;

      const cardElement = elements.getElement(CardElement);
      const { paymentIntent, error } = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        console.error(error);
        setMessage(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Deposit successful! Check your new balance in the app.');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: { xs: '80px', sm: '90px' },
          mb: 4,
          animation: `${fadeIn} 0.5s ease-out`,
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Go back" TransitionComponent={Fade}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ 
                color: 'primary.main',
                '&:hover': { backgroundColor: 'rgba(120, 115, 245, 0.1)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Deposit Funds
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Form */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                background: theme.palette.mode === 'light' 
                  ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                  : 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
              }}
            >
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label="Amount (USD)"
                  type="number"
                  fullWidth
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  sx={{ mb: 3 }}
                  inputProps={{ step: "0.01", min: "0" }}
                  InputProps={{
                    startAdornment: (
                      <AccountBalanceWalletIcon sx={{ mr: 1, color: 'primary.main' }} />
                    ),
                  }}
                />
                <Box
                  sx={{
                    mb: 3,
                    p: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'light' 
                      ? 'rgba(0, 0, 0, 0.02)'
                      : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Card Details
                  </Typography>
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={!stripe || loading}
                  startIcon={loading ? null : <LockIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  {loading ? 'Processing...' : 'Complete Deposit'}
                </Button>
                {message && (
                  <Alert 
                    severity={message.includes('successful') ? 'success' : 'error'}
                    sx={{ mt: 3 }}
                  >
                    {message}
                  </Alert>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Info */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                animation: `${slideIn} 0.5s ease-out`,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
                    : 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Secure Payment
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.
                </Typography>
              </Paper>

              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
                    : 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Deposit Guidelines
                </Typography>
                <Box component="ul" sx={{ pl: 2, '& li': { mb: 1 } }}>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Minimum deposit: $10
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Maximum deposit: $10,000
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Funds are available immediately after successful deposit
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    All transactions are secure and encrypted
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default function Deposit() {
  return (
    <Elements stripe={stripePromise}>
      <DepositForm />
    </Elements>
  );
}
