import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axiosInstance from '../services/axiosConfig';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { keyframes } from '@emotion/react';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Fade-in animation for the form container.
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// CardElement configuration: hide postal code and set custom styles.
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
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!stripe || !elements) return; // Ensure Stripe.js has loaded.

    setLoading(true);
    try {
      // 1. Create PaymentIntent via your backend.
      const response = await axiosInstance.post('/create-deposit-payment-intent/', { amount });
      const { client_secret } = response.data;

      // 2. Confirm the payment with Stripe.js.
      const cardElement = elements.getElement(CardElement);
      const { paymentIntent, error } = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        console.error(error);
        setMessage(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Deposit successful! Check your new balance in the app.');
        // Optionally, trigger an immediate balance refresh here.
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Paper 
      elevation={4}
      sx={{
        maxWidth: 400,
        margin: 'auto',
        p: 3,
        mt: 4,
        animation: `${fadeIn} 0.5s ease-in-out`,
      }}
    >
      <Typography variant="h4" align="center" sx={{ mb: 2, color: 'primary.main' }}>
        Deposit Funds
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Amount (USD)"
          type="number"
          fullWidth
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{ mb: 2 }}
          inputProps={{ step: "0.01", min: "0" }}
        />
        <Box
          sx={{
            mb: 2,
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            backgroundColor: '#fafafa',
          }}
        >
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </Box>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!stripe || loading}
          sx={{
            mb: 2,
            transition: 'background-color 0.3s ease',
            '&:hover': { backgroundColor: '#357ab7' },
          }}
        >
          {loading ? 'Processing...' : 'Deposit'}
        </Button>
        {message && (
          <Alert severity={message.includes('successful') ? 'success' : 'error'}>
            {message}
          </Alert>
        )}
      </Box>
    </Paper>
  );
}

export default function Deposit() {
  return (
    <Elements stripe={stripePromise}>
      <DepositForm />
    </Elements>
  );
}
