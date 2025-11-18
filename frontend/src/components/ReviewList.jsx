import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reviewService } from '../services/review';
import ReviewForm from './ReviewForm';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      const { data, error } = await reviewService.deleteReview(selectedReview._id, token);
      if (error) {
        setError(error);
      } else {
        const deletedId = data?.deletedId || selectedReview._id;
        setIsDeleteDialogOpen(false);
        setSelectedReview(null);
        if (onReviewDeleted) onReviewDeleted(deletedId);
      }
    } catch (err) {
      setError('Failed to delete review');
    }
  };

  const canModifyReview = (review) => {
    // Support multiple shapes: review.user may be populated object or just an id
    const reviewUserId = review?.user?._id || review?.user || review?.userId || null;
    return user && (user.isAdmin || user.id === reviewUserId);
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
                  By {(
                    // prefer populated username, fall back to string id or 'You'/Anonymous
                    review?.user?.username || (typeof review?.user === 'string' ? (review.user === (user?.id || user?._id) ? 'You' : review.user) : 'Anonymous')
                  )} on {new Date(review.date || review.createdAt || Date.now()).toLocaleDateString()}
                </Typography>
              </Box>

              {canModifyReview(review) && (
                <Box>
                  {/* Edit button opens edit dialog */}
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedReview(review);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
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

      {/* Edit Review Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Review</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <ReviewForm
              mouseId={mouseId}
              existingReview={selectedReview}
              onReviewSubmitted={(updated) => {
                if (onReviewUpdated) onReviewUpdated(updated);
                setIsEditDialogOpen(false);
                setSelectedReview(null);
              }}
              onClose={() => {
                setIsEditDialogOpen(false);
                setSelectedReview(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}