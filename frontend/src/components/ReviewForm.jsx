import { useState } from 'react';
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

export default function ReviewForm({ mouseId, onReviewSubmitted }) {
  const { user, token } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
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

      // Submit review (pass token for authenticated route)
      const { data, error: submitError } = await reviewService.createReview(
        mouseId,
        { rating, comment },
        token
      );

      if (submitError) {
        setError(submitError);
      } else {
        setSuccess('Review submitted successfully!');
        setRating(0);
        setComment('');
        if (onReviewSubmitted) {
          onReviewSubmitted(data);
        }
      }
    } catch (validationError) {
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
          error={!!error && error.includes('Comment')}
          helperText="Minimum 3 characters, maximum 500 characters"
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