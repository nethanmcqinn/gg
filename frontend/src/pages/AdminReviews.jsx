import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reviewService } from '../services/review';
import AdminReviewCard from '../components/AdminReviewCard';
import { Container, Typography, Box, Skeleton } from '@mui/material';

export default function AdminReviews() {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !user.isAdmin) return;
    (async () => {
      setLoading(true);
      const { data, error } = await reviewService.getAllReviews(token);
      if (error) setError(error);
      else setReviews(data || []);
      setLoading(false);
    })();
  }, [user?.isAdmin, token]);

  const handleRemoved = (reviewId) => {
    setReviews((prev) => prev.filter(r => r._id !== reviewId));
  };

  const handleModerated = (updated) => {
    // remove from pending list
    setReviews((prev) => prev.filter(r => r._id !== updated._id));
  };

  if (!user || !user.isAdmin) {
    return (
      <Container>
        <Typography variant="h5" sx={{ mt: 2 }}>Access denied. Admins only.</Typography>
      </Container>
    );
  }

  return (
    <Container>
  <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>Manage Reviews</Typography>
      {loading ? (
        <Box>
          <Skeleton height={60} sx={{ mb: 2 }} />
          <Skeleton height={60} sx={{ mb: 2 }} />
          <Skeleton height={60} />
        </Box>
      ) : (
        <Box>
          {reviews.length === 0 && <Typography>No pending reviews</Typography>}
          {reviews.map((r) => (
            <AdminReviewCard
              key={r._id}
              review={r}
              token={token}
              onRemoved={handleRemoved}
              onModerated={handleModerated}
            />
          ))}
        </Box>
      )}
    </Container>
  );
}
