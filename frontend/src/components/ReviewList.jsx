import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reviewService } from '../services/review';
import {
  Box,
  Typography,
  Rating,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

export default function ReviewList({ reviews, mouseId, onReviewDeleted, onReviewUpdated }) {
  const { user, token } = useAuth();
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      const { error } = await reviewService.deleteReview(selectedReview._id, token);
      if (error) {
        setError(error);
      } else {
        setIsDeleteDialogOpen(false);
        setSelectedReview(null);
        if (onReviewDeleted) {
          onReviewDeleted(selectedReview._id);
        }
      }
    } catch (err) {
      setError('Failed to delete review');
    }
  };

  const canModifyReview = (review) => {
    return user && (user.isAdmin || user.id === review.user._id);
  };

  if (!reviews?.length) {
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography>No reviews yet. Be the first to review!</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Customer Reviews
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {reviews.map((review) => (
        <Card key={review._id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Rating value={review.rating} readOnly precision={1} />
                <Typography variant="body2" color="text.secondary">
                  By {review.user.username} on {new Date(review.date).toLocaleDateString()}
                </Typography>
              </Box>

              {canModifyReview(review) && (
                <Box>
                  {user.id === review.user._id && (
                    <IconButton
                      size="small"
                      onClick={() => onReviewUpdated && onReviewUpdated(review)}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedReview(review);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Typography variant="body1" sx={{ mt: 1 }}>
              {review.comment}
            </Typography>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Review</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this review? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}