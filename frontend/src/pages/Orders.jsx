import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewForm from '../components/ReviewForm.jsx';

const statusColors = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error'
};

export default function Orders() {
  const { user, token, setToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewMouseId, setReviewMouseId] = useState(null);
    const [existingReview, setExistingReview] = useState(null);
    const [userReviewsMap, setUserReviewsMap] = useState({});

  useEffect(() => {
    // Show success message if redirected from checkout
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state
      window.history.replaceState({}, document.title);
    }

    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!token) {
      setError('Please login to view your orders');
      setTimeout(() => navigate('/login'), 1000);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/orders/myorders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setToken('');
          setError('Session expired. Please login again.');
          setTimeout(() => navigate('/login'), 1000);
          return;
        }
        throw new Error(data.message || 'Failed to fetch orders');
      }

      setOrders(data.orders);
      // load user's reviews once so we can show "Edit review" state inline
      try {
        const userId = user?._id || user?.id;
        if (userId) {
          const revRes = await fetch(`http://localhost:5000/api/reviews/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const revJson = await revRes.json();
          if (revRes.ok && Array.isArray(revJson.data)) {
            const map = {};
            revJson.data.forEach(r => {
              const mid = String(r.mouse?._id || r.mouse);
              map[mid] = r;
            });
            setUserReviewsMap(map);
          }
        }
      } catch (err) {
        console.warn('Failed to load user reviews:', err);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            You haven't placed any orders yet
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orders.map((order) => (
            <Card key={order._id} elevation={2}>
              <CardContent>
                {/* Order Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  <Chip
                    label={order.status.toUpperCase()}
                    color={statusColors[order.status] || 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Order Items */}
                <Box sx={{ mb: 2 }}>
                  {order.orderItems.map((item, index) => {
                    // canonical mouse id (string) for this item
                    let mouseId = null;
                    if (item.mouse) {
                      mouseId = (typeof item.mouse === 'object') ? (item.mouse._id || item.mouse.id) : item.mouse;
                    }
                    if (!mouseId && item._id) mouseId = item._id;
                    const existing = mouseId ? userReviewsMap[String(mouseId)] : null;

                    return (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          {item.image && (
                            <Box
                              component="img"
                              src={item.image}
                              alt={item.name}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 1
                              }}
                            />
                          )}
                          <Box>
                            <Typography variant="body1">{item.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.brand} × {item.quantity}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            ${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                          {order.isDelivered && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setExistingReview(existing || null);
                                setReviewMouseId(mouseId ? String(mouseId) : null);
                                setReviewDialogOpen(true);
                              }}
                              sx={{ ml: 2 }}
                            >
                              {existing ? 'Edit review' : 'Review product'}
                            </Button>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Order Summary */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Shipping Address
                    </Typography>
                    <Typography variant="body2">
                      {order.shippingAddress.fullName}<br />
                      {order.shippingAddress.address}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order Total
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${order.totalPrice.toFixed(2)}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Items: ${order.itemsPrice.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Shipping: ${order.shippingPrice.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tax: ${order.taxPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Payment & Delivery Status */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  {/* <Chip
                    label={order.isPaid ? 'Paid' : 'Not Paid'}
                    color={order.isPaid ? 'success' : 'default'}
                    size="small"
                  /> */}
                  <Chip
                    label={order.isDelivered ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString()}` : 'Not Delivered'}
                    color={order.isDelivered ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Review dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          {reviewMouseId && (
            // lazy import component to avoid circular deps - import at top is already present in components folder
            <Box sx={{ py: 1 }}>
              {/* Note: ReviewForm expects props: mouseId, existingReview, onReviewSubmitted, onClose */}
              <ReviewForm
                mouseId={reviewMouseId}
                existingReview={existingReview}
                onReviewSubmitted={(data) => {
                  // update local map so UI immediately reflects new review
                  try {
                    const mid = String(data?.mouse?._id || data?.mouse || reviewMouseId);
                    setUserReviewsMap(prev => ({ ...prev, [mid]: data }));
                    setExistingReview(data);
                  } catch (err) {
                    console.warn('Failed to update reviews map after submit', err);
                  }
                  setSuccessMessage('Thanks for your review!');
                  setReviewDialogOpen(false);
                }}
                onClose={() => setReviewDialogOpen(false)}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
