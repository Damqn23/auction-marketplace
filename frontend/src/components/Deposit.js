// src/components/Deposit.js

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axiosInstance from '../services/axiosConfig';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);


function DepositForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!stripe || !elements) {
      return; // Stripe.js has not loaded yet
    }

    try {
      // 1. Create PaymentIntent via your backend
      const response = await axiosInstance.post('/create-deposit-payment-intent/', {
        amount,
      });
      const { client_secret } = response.data;

      // 2. Use Stripe.js to confirm the payment
      const cardElement = elements.getElement(CardElement);
      const { paymentIntent, error } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        // Payment failed
        console.error(error);
        setMessage(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded!
        setMessage('Deposit successful! Check your new balance in the app.');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Deposit Funds</h2>
      <div>
        <label>Amount (USD):</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div style={{ margin: '20px 0' }}>
        <CardElement />
      </div>
      <button type="submit" disabled={!stripe}>
        Deposit
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

// Wrap the form in <Elements> to provide Stripe context
export default function Deposit() {
  return (
    <Elements stripe={stripePromise}>
      <DepositForm />
    </Elements>
  );
}
