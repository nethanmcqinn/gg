import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reviewService } from '../services/review';
import {
  Box,
  Button,
  Rating,
  TextField,
  Typography,
  Alert,
  Paper
} from '@mui/material';
import * as yup from 'yup';

const reviewSchema = yup.object().shape({
  rating: yup
    .number()
    .required('Rating is required')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  comment: yup
    .string()
    .required('Comment is required')
    .min(3, 'Comment must be at least 3 characters')
    .max(500, 'Comment must not exceed 500 characters'),
});

export default function ReviewForm({ mouseId, onReviewSubmitted, existingReview = null, onClose = null }) {
  const { user, token } = useAuth();
  const [canReview, setCanReview] = useState(null); // null = unknown/loading, true/false = allowed
  const [canReviewReason, setCanReviewReason] = useState('');
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  // editingReviewId derived from prop so it updates when prop changes
  const editingReviewId = existingReview?._id || null;
  // sync form fields when existingReview changes
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setComment(existingReview.comment || '');
      // allow editing even if canReview would be false because user already reviewed
      setCanReview(true);
    }
  }, [existingReview]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      // Validate form data
      await reviewSchema.validate({ rating, comment });

      console.log('Submitting review:', { mouseId, rating, comment, token: token ? 'present' : 'missing' });

      // Submit or update review (pass token for authenticated route)
      let data, submitError;
      if (editingReviewId) {
        const res = await reviewService.updateReview(editingReviewId, { rating, comment }, token);
        data = res.data; submitError = res.error;
      } else {
        const res = await reviewService.createReview(mouseId, { rating, comment }, token);
        data = res.data; submitError = res.error;
      }

      console.log('Review response:', { data, error: submitError });

      if (submitError) {
        // Check if it's a profanity error
        if (typeof submitError === 'string' && submitError.toLowerCase().includes('inappropriate')) {
          setError('⚠️ ' + submitError + ' Please edit your review and avoid using offensive language.');
        } else {
          setError(submitError);
        }
      } else {
        setSuccess(editingReviewId ? '✅ Review updated successfully!' : '✅ Review submitted successfully!');
        if (!editingReviewId) {
          setRating(0);
          setComment('');
        }
        if (onReviewSubmitted) {
          onReviewSubmitted(data);
        }
        // close dialog if provided
        if (onClose) onClose();
      }
    } catch (validationError) {
      console.error('Validation error:', validationError);
      setError(validationError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Please log in to leave a review.</Typography>
      </Paper>
    );
  }

  // Check eligibility for reviewing. If editing an existing review, skip the can-review check
  // so the user is allowed to edit their own review.
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (editingReviewId) {
        // If we're editing, allow editing immediately and skip server check.
        if (!mounted) return;
        setCanReview(true);
        setCanReviewReason('');
        return;
      }

      try {
        const { data, error } = await reviewService.canReview(mouseId, token);
        if (!mounted) return;
        if (error) {
          // treat errors as not allowed (but still show message)
          setCanReview(false);
          setCanReviewReason(error);
        } else if (data) {
          setCanReview(!!data.canReview);
          setCanReviewReason(data.reason || '');
        } else {
          setCanReview(false);
        }
      } catch (err) {
        if (!mounted) return;
        setCanReview(false);
        setCanReviewReason(err.message || 'error');
      }
    })();

    return () => { mounted = false; };
  }, [mouseId, token, editingReviewId]);

  if (canReview === false) {
    // Show a helpful message when user can't review
    let message = 'You can only review products that you have ordered and received.';
    if (canReviewReason === 'already_reviewed') message = 'You have already reviewed this product.';
    if (canReviewReason === 'not_purchased_or_not_delivered') message = 'You can only review products that are in your order history and marked as delivered.';
    if (canReviewReason && !['already_reviewed','not_purchased_or_not_delivered'].includes(canReviewReason) && typeof canReviewReason === 'string') {
      message = canReviewReason;
    }

    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>{message}</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          Write a Review
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography component="legend">Rating</Typography>
          <Rating
            name="rating"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            precision={1}
            size="large"
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Your Review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          error={!!error && (error.includes('Comment') || error.includes('inappropriate'))}
          helperText="Min 3, max 500 characters. Please keep your review respectful and avoid profanity."
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ mt: 1 }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </Box>
    </Paper>
  );
}