import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMouse } from '../services/api.js';
import { reviewService } from '../services/review';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import ImageSlideshow from '../components/ImageSlideshow';
import { Box, Container, Grid, Typography, Rating, Skeleton, Button, Snackbar, Alert } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useCart } from '../context/CartContext.jsx';

export default function Product() {
  const { slug } = useParams();
  const [mouse, setMouse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchMouse = async () => {
      setLoading(true);
      try {
        const res = await getMouse(slug);
        setMouse(res);
      } catch (error) {
        console.error('Error fetching mouse:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMouse();
  }, [slug]);

  // Helper to reload mouse data (used after review create/update/delete to refresh aggregated rating)
  const reloadMouse = async () => {
    try {
      const res = await getMouse(slug);
      setMouse(res);
    } catch (err) {
      console.error('Failed to reload mouse:', err);
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      if (!mouse?._id) return;

      setReviewsLoading(true);
      try {
        const { data, error } = await reviewService.getMouseReviews(mouse._id);
        if (!error && data) {
          setReviews(data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [mouse?._id]);

  const handleReviewSubmitted = (newReview) => {
    setReviews((prevReviews) => [newReview, ...prevReviews]);
    // refresh mouse to pick up the new aggregated rating
    reloadMouse();
  };

  const handleReviewDeleted = (reviewId) => {
    setReviews((prevReviews) => prevReviews.filter(review => review._id !== reviewId));
    // refresh mouse to pick up the updated aggregated rating
    reloadMouse();
  };

  const handleReviewUpdated = (updatedReview) => {
    setReviews((prevReviews) => 
      prevReviews.map(review => {
        if (review._id !== updatedReview._id) return review;
        // Ensure we keep the original review.user info if the updated payload
        // doesn't include it (some APIs return the updated review without populating user).
        const merged = { ...review, ...updatedReview };
        if (!merged.user) merged.user = review.user;
        return merged;
      })
    );
    // refresh mouse to pick up the updated aggregated rating
    reloadMouse();
  };

  const handleAddToCart = () => {
    addToCart(mouse);
    setSnackbarOpen(true);
  };

  if (loading) return <Skeleton variant="rectangular" height={400} />;
  if (!mouse) return <Typography>Product not found</Typography>;

  return (
    <Container>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <ImageSlideshow images={mouse.images} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Box className="product-info">
            <Typography variant="h4" component="h1" gutterBottom>
              {mouse.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {mouse.brand}
            </Typography>
            <Typography variant="h5" color="primary" gutterBottom>
              ${mouse.price?.toFixed(2)}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {/* Use higher precision so the star display matches the numeric average more closely */}
              <Rating value={mouse.rating} precision={0.1} readOnly />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({reviews.length} reviews)
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              <strong>Sensor:</strong> {mouse.sensor}
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>DPI:</strong> Up to {mouse.dpiMax.toLocaleString()}
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Weight:</strong> {mouse.weightGrams}g
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Connection:</strong> {mouse.connection}
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>RGB:</strong> {mouse.rgb ? 'Yes' : 'No'}
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<AddShoppingCartIcon />}
              onClick={handleAddToCart}
              sx={{ mt: 2 }}
            >
              Add to Cart
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <ReviewForm 
            mouseId={mouse._id} 
            onReviewSubmitted={handleReviewSubmitted} 
          />
          
          {reviewsLoading ? (
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={100} />
            </Box>
          ) : (
            <ReviewList
              reviews={reviews}
              mouseId={mouse._id}
              onReviewDeleted={handleReviewDeleted}
              onReviewUpdated={handleReviewUpdated}
            />
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" variant="filled">
          Added to cart!
        </Alert>
      </Snackbar>
    </Container>
  );
}