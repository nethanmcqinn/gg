import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

const shippingSchema = Yup.object({
  fullName: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .required('Full name is required'),
  address: Yup.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address cannot exceed 200 characters')
    .required('Address is required'),
  city: Yup.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City cannot exceed 50 characters')
    .required('City is required'),
  postalCode: Yup.string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(10, 'Postal code cannot exceed 10 characters')
    .required('Postal code is required'),
  country: Yup.string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country cannot exceed 50 characters')
    .required('Country is required'),
  phone: Yup.string()
    .min(7, 'Phone must be at least 7 characters')
    .max(20, 'Phone cannot exceed 20 characters')
    .required('Phone number is required')
});

const steps = ['Shipping Address', 'Payment Method', 'Review Order'];

export default function Checkout() {
  const { user, token, setToken } = useAuth();
  const navigate = useNavigate();
  const {
    cartItems,
    getCartTotal,
    getShippingCost,
    getTaxAmount,
    getFinalTotal,
    clearCart
  } = useCart();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    setTimeout(() => navigate('/cart'), 0);
    return null;
  }

  // Redirect if not logged in
  if (!user) {
    setTimeout(() => navigate('/login'), 0);
    return null;
  }

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate shipping address
      try {
        await shippingSchema.validate(shippingAddress, { abortEarly: false });
        setFormErrors({});
        setActiveStep(1);
      } catch (err) {
        const errors = {};
        err.inner?.forEach((e) => {
          errors[e.path] = e.message;
        });
        setFormErrors(errors);
      }
    } else if (activeStep === 1) {
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Place order
      await handlePlaceOrder();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      if (!token) {
        setError('Please login to place an order');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const orderData = {
        orderItems: cartItems.map((item) => ({
          mouse: item._id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shippingAddress,
        paymentMethod,
        itemsPrice: getCartTotal(),
        shippingPrice: getShippingCost(),
        taxPrice: getTaxAmount(),
        totalPrice: getFinalTotal()
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          setToken('');
          setError('Session expired. Please login again.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        throw new Error(data.message || 'Failed to place order');
      }

      // Clear cart and redirect to orders page
      clearCart();
      navigate('/orders', { 
        state: { message: 'Order placed successfully! Check your email for confirmation.', orderId: data.order._id }
      });
    } catch (err) {
      console.error('Place order error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ my: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          {error.includes('login') && (
            <Button 
              size="small" 
              sx={{ ml: 2 }} 
              variant="outlined" 
              onClick={() => {
                setToken('');
                navigate('/login');
              }}
            >
              Go to Login
            </Button>
          )}
        </Alert>
      )}

      {/* Step 0: Shipping Address */}
      {activeStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Shipping Address
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
            <TextField
              name="fullName"
              label="Full Name"
              value={shippingAddress.fullName}
              onChange={handleShippingChange}
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
              fullWidth
              required
            />
            <TextField
              name="address"
              label="Address"
              value={shippingAddress.address}
              onChange={handleShippingChange}
              error={!!formErrors.address}
              helperText={formErrors.address}
              fullWidth
              required
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="city"
                label="City"
                value={shippingAddress.city}
                onChange={handleShippingChange}
                error={!!formErrors.city}
                helperText={formErrors.city}
                required
              />
              <TextField
                name="postalCode"
                label="Postal Code"
                value={shippingAddress.postalCode}
                onChange={handleShippingChange}
                error={!!formErrors.postalCode}
                helperText={formErrors.postalCode}
                required
              />
            </Box>
            <TextField
              name="country"
              label="Country"
              value={shippingAddress.country}
              onChange={handleShippingChange}
              error={!!formErrors.country}
              helperText={formErrors.country}
              fullWidth
              required
            />
            <TextField
              name="phone"
              label="Phone Number"
              value={shippingAddress.phone}
              onChange={handleShippingChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              fullWidth
              required
            />
          </Box>
        </Paper>
      )}

      {/* Step 1: Payment Method */}
      {activeStep === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Method
          </Typography>
          <FormControl sx={{ mt: 2 }}>
            <FormLabel>Select Payment Method</FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {/* <FormControlLabel
                value="credit-card"
                control={<Radio />}
                label="Credit Card"
              />
              <FormControlLabel
                value="debit-card"
                control={<Radio />}
                label="Debit Card"
              />
              <FormControlLabel
                value="paypal"
                control={<Radio />}
                label="PayPal"
              /> */}
              <FormControlLabel
                value="cash-on-delivery"
                control={<Radio />}
                label="Cash on Delivery"
              />
            </RadioGroup>
          </FormControl>
        </Paper>
      )}

      {/* Step 2: Review Order */}
      {activeStep === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Review Your Order
          </Typography>

          {/* Order Items */}
          <Box sx={{ mt: 2 }}>
            {cartItems.map((item) => (
              <Box
                key={item._id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box
                    component="img"
                    src={item.image || '/placeholder.png'}
                    alt={item.name}
                    sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                  />
                  <Box>
                    <Typography variant="body1">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {item.quantity}
                    </Typography>
                  </Box>
                </Box>
                <Typography>₱{(item.price * item.quantity).toFixed(2)}</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Shipping Address */}
          <Typography variant="subtitle1" gutterBottom>
            Shipping Address
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {shippingAddress.fullName}<br />
            {shippingAddress.address}<br />
            {shippingAddress.city}, {shippingAddress.postalCode}<br />
            {shippingAddress.country}<br />
            Phone: {shippingAddress.phone}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Payment Method */}
          <Typography variant="subtitle1" gutterBottom>
            Payment Method
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {paymentMethod.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Order Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Subtotal:</Typography>
            <Typography>₱{getCartTotal().toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Shipping:</Typography>
            <Typography>
              {getShippingCost() === 0 ? 'FREE' : `₱${getShippingCost().toFixed(2)}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Tax:</Typography>
            <Typography>₱{getTaxAmount().toFixed(2)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6" color="primary">
              ₱{getFinalTotal().toFixed(2)}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading}
        >
          {activeStep === 2 ? (loading ? 'Placing Order...' : 'Place Order') : 'Next'}
        </Button>
      </Box>
    </Container>
  );
}
