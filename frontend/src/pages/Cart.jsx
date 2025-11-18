import { Box, Container, Typography, Button, Paper, IconButton, Divider, Alert } from '@mui/material';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function Cart() {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getCartTotal,
    getShippingCost,
    getTaxAmount,
    getFinalTotal
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingCartIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Your Cart is Empty
        </Typography>
        <Typography color="text.secondary" paragraph>
          Start shopping to add items to your cart
        </Typography>
        <Button variant="contained" onClick={() => navigate('/catalog')}>
          Browse Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Shopping Cart
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mt: 3 }}>
        {/* Cart Items */}
        <Box>
          {cartItems.map((item) => (
            <Paper key={item._id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* Product Image */}
                <Box
                  component="img"
                  src={item.image || '/placeholder.png'}
                  alt={item.name}
                  sx={{
                    width: 100,
                    height: 100,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/product/${item.slug}`)}
                />

                {/* Product Details */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={() => navigate(`/product/${item.slug}`)}
                  >
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.brand}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                    ${item.price.toFixed(2)}
                  </Typography>
                </Box>

                {/* Quantity Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                    {item.quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>

                {/* Item Total */}
                <Typography variant="h6" sx={{ minWidth: 100, textAlign: 'right' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Typography>

                {/* Remove Button */}
                <IconButton
                  color="error"
                  onClick={() => removeFromCart(item._id)}
                  aria-label="remove item"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}

          <Button
            variant="outlined"
            color="error"
            onClick={clearCart}
            sx={{ mt: 2 }}
          >
            Clear Cart
          </Button>
        </Box>

        {/* Order Summary */}
        <Paper sx={{ p: 3, height: 'fit-content', position: 'sticky', top: 20 }}>
          <Typography variant="h5" gutterBottom>
            Order Summary
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Subtotal:</Typography>
            <Typography>${getCartTotal().toFixed(2)}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Shipping:</Typography>
            <Typography>
              {getShippingCost() === 0 ? (
                <span style={{ color: 'green' }}>FREE</span>
              ) : (
                `$${getShippingCost().toFixed(2)}`
              )}
            </Typography>
          </Box>

          {getShippingCost() > 0 && (
            <Alert severity="info" sx={{ my: 1, fontSize: '0.875rem' }}>
              Free shipping on orders over $100
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Tax (10%):</Typography>
            <Typography>${getTaxAmount().toFixed(2)}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6" color="primary">
              ${getFinalTotal().toFixed(2)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>

          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => navigate('/catalog')}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
